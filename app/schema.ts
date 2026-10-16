import { z } from 'zod';
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v, 'Invalid date');
const prose = z.string().min(1).max(3000);
export const sectors = ['人工智能', '半导体与通信', '能源与电力', '汽车与制造', '医疗与生命科学', '消费与文旅', '宏观与贸易', '金融与支付', '农业与食品', '地产与基建', '航天与前沿科技', '教育与工作'];
export const eventSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,80}$/), title: prose, sector: z.enum(sectors as [string, ...string[]]),
  region: z.enum(['中国', '海外', '跨境']), date: day, published: day,
  kind: z.enum(['已发生', '数据发布', '计划公布']), confidence: z.enum(['一手确认', '可靠报道', '待验证']),
  stage: z.enum(['早期信号', '加速发展', '商业验证']), horizon: z.enum(['短期', '中期', '长期']),
  fact: prose, interpretation: prose, investment: prose, business: prose, career: prose,
  watch: prose, risk: prose, companies: z.array(prose).max(20),
  storyId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  changeType: z.enum(['首次出现', '持续进展', '关联观察']).default('首次出现'),
  previousEventIds: z.array(z.string()).max(10).default([]),
  relatedEventIds: z.array(z.string()).max(10).default([]),
  delta: prose.optional(), selectionReason: prose.optional(),
  aiTopics: z.array(z.enum(['基础模型', 'AI应用与智能体', '具身智能', 'VLA', 'WAM', '算力与基础设施'])).default([]),
  sources: z.array(z.object({ name: prose, url: z.string().url().refine(v => v.startsWith('https://')), date: day, type: z.enum(['一手', '媒体']) })).min(1).max(10),
});
export const reportSchema = z.object({
  id: day, number: z.number().int().positive(), title: prose, subtitle: prose, start: day, end: day,
  generatedAt: z.string().datetime(), lead: prose, takeaways: z.array(prose).min(1).max(8),
  events: z.array(eventSchema).min(1).max(40), coverageGaps: z.array(prose).max(20),
  actions: z.array(z.object({ type: z.enum(['投资', '创业', '成长']), title: prose, detail: prose })).max(12),
  nextWeek: z.array(z.object({ date: day, title: prose, detail: prose, url: z.string().url() })).max(12),
  review: z.array(prose).max(20),
}).superRefine((r, ctx) => {
  if(r.start > r.end || r.id !== r.end) ctx.addIssue({ code:'custom', message:'Report ID must match end; start must precede end' });
  if(new Set(r.events.map(e=>e.id)).size !== r.events.length) ctx.addIssue({ code:'custom', message:'Duplicate event IDs' });
  for(const e of r.events) {
    if(e.published < r.start || e.published > r.end || e.date > r.end) ctx.addIssue({ code:'custom', message:'Event is outside the report window: '+e.id });
    if(e.changeType !== '首次出现' && (!e.delta || !e.previousEventIds.length)) ctx.addIssue({code:'custom', message:'Cross-week signal needs previous evidence and a material delta: '+e.id});
    if([...e.previousEventIds,...e.relatedEventIds].includes(e.id)) ctx.addIssue({code:'custom', message:'Signal cannot reference itself: '+e.id});
  }
});
export type Report = z.infer<typeof reportSchema>;
export type Signal = z.infer<typeof eventSchema>;
export const preferencesSchema = z.object({ saved: z.array(z.string().max(100)).max(500), companies: z.array(z.string().min(1).max(80)).max(100), notebook: z.string().max(15000) });
