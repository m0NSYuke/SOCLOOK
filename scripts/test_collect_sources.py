import unittest
from datetime import datetime, timezone
from collect_sources import canonical_url, parse_feed

SOURCE = {'id': 'test', 'name': 'Fixture', 'task': 'AI'}
CUTOFF = datetime(2026, 10, 17, 1, tzinfo=timezone.utc)


class FeedTests(unittest.TestCase):
    def test_rss_window_uses_shanghai_date_and_ignores_unsafe_links(self):
        data = b'''<rss><channel>
        <item><title>New &amp; useful</title><link>https://example.org/a#top</link><pubDate>Sat, 10 Oct 2026 17:00:00 GMT</pubDate></item>
        <item><title>Old</title><link>https://example.org/old</link><pubDate>Sat, 10 Oct 2026 10:00:00 GMT</pubDate></item>
        <item><title>Unsafe</title><link>javascript:alert(1)</link><pubDate>Sun, 11 Oct 2026 00:00:00 GMT</pubDate></item>
        <item><title>Future</title><link>https://example.org/future</link><pubDate>Sun, 18 Oct 2026 00:00:00 GMT</pubDate></item>
        </channel></rss>'''
        items, skipped = parse_feed(data, SOURCE, '2026-10-11', CUTOFF)
        self.assertEqual([item['url'] for item in items], ['https://example.org/a'])
        self.assertEqual(items[0]['title'], 'New & useful')
        self.assertEqual(skipped, 1)

    def test_atom_requires_publication_date(self):
        data = b'''<feed xmlns="http://www.w3.org/2005/Atom">
        <entry><title>Release</title><link rel="self" href="https://example.org/feed/1"/><link href="https://example.org/1"/><published>2026-10-12T12:00:00Z</published></entry>
        <entry><title>Edited old item</title><link href="https://example.org/2"/><updated>2026-10-12T12:00:00Z</updated></entry></feed>'''
        items, skipped = parse_feed(data, SOURCE, '2026-10-11', CUTOFF)
        self.assertEqual([item['url'] for item in items], ['https://example.org/1'])
        self.assertEqual(skipped, 1)

    def test_no_credentials_or_http(self):
        for value in ('http://example.org', 'https://user:password@example.org', 'javascript:alert(1)'):
            self.assertIsNone(canonical_url(value))

    def test_html_error_is_not_successful_feed(self):
        with self.assertRaises(ValueError):
            parse_feed(b'<html><body>Denied</body></html>', SOURCE, '2026-10-11', CUTOFF)


if __name__ == '__main__':
    unittest.main()
