import type { Signal } from './schema';
export const aiLanes=[
  ['基础模型','能力、推理、多模态、开源生态与训练效率'],
  ['AI应用与智能体','真实用户、任务成功率、付费留存与工作流'],
  ['具身智能','数据采集、机器人本体、真实环境部署与安全'],
  ['VLA','视觉—语言—动作模型；跨任务泛化、操作成功率与推理延迟'],
  ['WAM','世界动作模型；预测与行动结合、闭环控制和长时序任务'],
  ['算力与基础设施','芯片、算力供给、电力、成本与利用率']
];
export default function AIResearch({events,onOpen}:{events:Signal[];onOpen:(e:Signal)=>void}) {
 const ai=events.filter(e=>e.sector==='人工智能'||e.aiTopics.length>0);
 return <><section className="plain-card intro ai-intro"><span className="kicker">PRIMARY RESEARCH / ARTIFICIAL INTELLIGENCE</span><h2>深入 AI，理解技术怎样变成现实能力</h2><p>m0NSYuke 的长期核心研究方向。同步观察中国与海外的模型公司、机器人公司、研究团队和基础设施企业；每周只选有实质新增证据的变化。</p><div className="research-lanes">{aiLanes.map(([name,detail])=><div key={name}><h3>{name}</h3><p>{detail}</p></div>)}</div></section><section className="plain-card"><h3>本期 AI 证据</h3><p>当前 {ai.length} 条。该栏目只展示已核实的本期事件，不把研究方向填成新闻。</p>{ai.map(e=><button className="company-event" key={e.id} onClick={()=>onOpen(e)}>{e.title} ↗</button>)}</section><section className="plain-card"><h3>每次研究要回答的问题</h3><div className="research-lanes">{[['技术证据','读取论文、代码和评测条件，检查消融、泛化、复现与数据泄漏。'],['落地证据','区分演示、试点、交付和规模化使用；看真实任务与部署成本。'],['商业证据','区分融资与收入，验证客户、订单、续费、毛利和现金消耗。'],['跨周变化','连接模型、数据、硬件、算力与政策；写出新增事实和能推翻判断的证据。']].map(([title,detail])=><div key={title}><h3>{title}</h3><p>{detail}</p></div>)}</div><p className="mini-note">术语参考：<a href="https://arxiv.org/abs/2410.24164" target="_blank" rel="noopener noreferrer">π0：VLA 原始研究</a> · <a href="https://arxiv.org/abs/2605.12090" target="_blank" rel="noopener noreferrer">World Action Models 原始论文</a>。研究方向是持续观察范围，不表示相关公司本周有新进展。</p></section></>;
}
