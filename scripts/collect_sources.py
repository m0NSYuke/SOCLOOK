"""Collect dated RSS/Atom links. Output is discovery material, never a reviewed report."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from hashlib import sha256
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SHANGHAI = timezone(timedelta(hours=8))
MAX_BYTES = 4 * 1024 * 1024


def local_name(tag):
    return tag.rsplit('}', 1)[-1]


def parse_date(value):
    try:
        result = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
    except ValueError:
        try:
            result = parsedate_to_datetime(value.strip())
        except (ValueError, TypeError, OverflowError):
            return None
    return result if result.tzinfo else result.replace(tzinfo=timezone.utc)


def canonical_url(value):
    try:
        parts = urlsplit(value.strip())
        if parts.scheme != 'https' or not parts.hostname or parts.username or parts.password:
            return None
        return urlunsplit((parts.scheme, parts.netloc.lower(), parts.path, parts.query, ''))
    except ValueError:
        return None


def parse_feed(payload, source, start, cutoff):
    root = ET.fromstring(payload)
    if local_name(root.tag) not in ('rss', 'feed', 'RDF'):
        raise ValueError('Response is not an RSS/Atom feed')
    items, skipped = [], 0
    for entry in root.iter():
        if local_name(entry.tag) not in ('item', 'entry'):
            continue
        fields = {}
        links = []
        for child in entry:
            key = local_name(child.tag)
            fields.setdefault(key, ''.join(child.itertext()).strip())
            if key == 'link' and child.attrib.get('rel', 'alternate') == 'alternate':
                links.append(child.attrib.get('href') or (child.text or ''))
        title = re.sub(r'\s+', ' ', fields.get('title', '')).strip()[:300]
        url = next((valid for link in links if (valid := canonical_url(link))), None)
        published = parse_date(fields.get('published') or fields.get('pubDate') or fields.get('date') or '')
        # Atom updated is a modification timestamp, not a reliable publication date.
        if not title or not url or not published:
            skipped += 1
            continue
        if published.astimezone(SHANGHAI).date().isoformat() < start or published > cutoff:
            continue
        items.append({
            'id': sha256(url.encode()).hexdigest()[:20], 'title': title, 'url': url,
            'publishedAt': published.astimezone(timezone.utc).isoformat(),
            'sourceId': source['id'], 'sourceName': source['name'], 'task': source['task'],
            'status': '待核验',
        })
    return items, skipped


def collect(source, start, cutoff):
    try:
        url = canonical_url(source['url'])
        if not url:
            raise ValueError('Feed must use HTTPS without credentials')
        request = Request(url, headers={'User-Agent': 'SOCLOOK/1.0 (public RSS reader)', 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'})
        with urlopen(request, timeout=25) as response:
            if not response.geturl().startswith('https://'):
                raise ValueError('Insecure redirect rejected')
            payload = response.read(MAX_BYTES + 1)
        if len(payload) > MAX_BYTES:
            raise ValueError('Feed exceeds size limit')
        items, skipped = parse_feed(payload, source, start, cutoff)
        return items, {'id': source['id'], 'name': source['name'], 'ok': True, 'count': len(items), 'skipped': skipped}
    except Exception as error:
        # Never persist request headers or arbitrary response bodies.
        return [], {'id': source['id'], 'name': source['name'], 'ok': False, 'error': type(error).__name__}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', help='Inclusive date in Asia/Shanghai; defaults to the day after the latest reviewed report')
    args = parser.parse_args()
    config = json.loads((ROOT / 'config/sources.json').read_text(encoding='utf-8'))
    seed = json.loads((ROOT / 'app/seed.json').read_text(encoding='utf-8'))
    start = args.start or (datetime.fromisoformat(seed['end']) + timedelta(days=1)).date().isoformat()
    datetime.strptime(start, '%Y-%m-%d')
    cutoff = datetime.now(timezone.utc)
    end = cutoff.astimezone(SHANGHAI).date().isoformat()
    if start > end:
        raise ValueError('Collection start is in the future')
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda source: collect(source, start, cutoff), config['feeds']))
    statuses = [status for _, status in results]
    if not statuses or not any(status['ok'] for status in statuses):
        raise RuntimeError('All feeds failed; previous collection is preserved')
    unique = {}
    for items, _ in results:
        for item in items:
            unique.setdefault(item['url'], item)
    output = {
        'format': 1, 'generatedAt': cutoff.isoformat(), 'start': start, 'end': end,
        'status': 'partial' if any(not s['ok'] for s in statuses) else 'ok',
        'items': sorted(unique.values(), key=lambda item: (item['publishedAt'], item['id']), reverse=True),
        'sources': statuses,
        'coverageGaps': [task['name'] + '：' + task['note'] for task in config['researchTasks']],
    }
    data = ROOT / 'data'
    (data / 'collections').mkdir(parents=True, exist_ok=True)
    content = json.dumps(output, ensure_ascii=False, indent=2) + '\n'
    (data / 'collections' / f'{end}.json').write_text(content, encoding='utf-8')
    (data / 'latest.json').write_text(content, encoding='utf-8')
    print(f"Collected {len(unique)} candidate links; {sum(s['ok'] for s in statuses)}/{len(statuses)} feeds succeeded. Reviewed report unchanged.")


if __name__ == '__main__':
    main()
