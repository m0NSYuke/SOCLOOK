import { useEffect, useState } from 'react';

type Collection = {
  generatedAt: string; start: string; end: string; status: string;
  items: {id: string; title: string; url: string; sourceName: string; task: string; publishedAt: string}[];
  sources: {id: string; name: string; ok: boolean; count?: number; skipped?: number}[];
  coverageGaps: string[];
};

export default function SourceInbox() {
  const [data, setData] = useState<Collection | null>(null);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState('全部任务');
  useEffect(() => {
    fetch('./collection.json', {cache: 'no-store'}).then(response => {
      if (!response.ok) throw Error('Unavailable');
      return response.json();
    }).then(setData).catch(() => setFailed(true));
  }, []);
  if (!data) return <section className="plain-card"><h2>每周自动采集</h2><p>{failed ? '尚无成功采集记录。首次运行成功后，这里会显示来源链接与覆盖状态。' : '正在读取采集记录…'}</p></section>;
  const tasks = [...new Set(data.items.map(item => item.task))];
  const items = data.items.filter(item => filter === '全部任务' || item.task === filter);
  return <>
    <section className="plain-card intro"><span className="kicker">SOURCE INBOX</span><h2>先收集线索，再形成判断</h2><p>这里是官方订阅源的自动采集结果，均待阅读原文核验。正式周报在“本周观察”中；采集成功不代表周报研究完成。</p><p>最近采集：{new Date(data.generatedAt).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', hour12: false})}（北京时间）<br/>采集窗口：{data.start} — {data.end} · {data.items.length} 条候选 · {data.status === 'partial' ? '部分来源失败' : '已配置订阅源采集成功'}</p><div className="sector-tabs">{['全部任务', ...tasks].map(task => <button key={task} className={task === filter ? 'selected' : ''} onClick={() => setFilter(task)}>{task}</button>)}</div></section>
    <div className="signal-list">{items.map(item => <article className="plain-card" key={item.id}><div className="eyebrow"><span>{item.sourceName}</span><span>{new Date(item.publishedAt).toLocaleDateString('zh-CN', {timeZone: 'Asia/Shanghai'})}</span><span className="change-badge">待核验</span></div><h3><a href={item.url} target="_blank" rel="noreferrer">{item.title} ↗</a></h3><p>{item.task}</p></article>)}</div>
    {!items.length && <div className="empty">该窗口没有匹配的新条目，不能据此判断整个行业没有变化。</div>}
    <section className="plain-card"><h3>来源状态与覆盖缺口</h3>{data.sources.map(source => <p key={source.id}>{source.name}：{source.ok ? `${source.count} 条；缺少日期或安全链接等原因跳过 ${source.skipped ?? 0} 条` : '采集失败，本次没有覆盖'}</p>)}{data.coverageGaps.map(gap => <p key={gap}>{gap}</p>)}</section>
  </>;
}
