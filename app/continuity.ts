import type { Report } from './schema';
export function validateArchive(reports: Report[]) {
  const errors: string[]=[];
  const ids=new Set<string>();
  const sorted=[...reports].sort((a,b)=>a.end.localeCompare(b.end));
  for(let i=0;i<sorted.length;i++) {
    const report=sorted[i];
    if(i && report.start<=sorted[i-1].end) errors.push('Weekly windows overlap: '+report.id);
    const prior=sorted.slice(0,i).flatMap(r=>r.events);
    for(const event of report.events) {
      if(ids.has(event.id)) errors.push('Event ID reused across issues: '+event.id);
      ids.add(event.id);
      for(const id of event.previousEventIds) if(!prior.some(e=>e.id===id)) errors.push('Missing earlier event: '+id);
      if(event.changeType==='持续进展' && (!event.storyId || !event.previousEventIds.some(id=>prior.some(p=>p.id===id&&p.storyId===event.storyId)))) errors.push('Continuation must retain its story ID: '+event.id);
      if(event.changeType!=='首次出现' && event.previousEventIds.some(id=>prior.some(p=>p.id===id&&p.fact===event.fact))) errors.push('Old facts repeated without new evidence: '+event.id);
      for(const id of event.relatedEventIds) if(!reports.some(r=>r.events.some(e=>e.id===id))) errors.push('Missing related event: '+id);
    }
  }
  return errors;
}
