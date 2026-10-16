import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {reportSchema} from '../app/schema.ts';
import {validateArchive} from '../app/continuity.ts';
const current = reportSchema.parse(JSON.parse(readFileSync('app/seed.json', 'utf8')));
const history = JSON.parse(readFileSync('app/history.json', 'utf8')).map(r => reportSchema.parse(r));
const reports = [current, ...history];
assert.deepEqual(validateArchive(reports), [], 'Invalid cross-week history');
assert.equal(new Set(reports.map(r => r.id)).size, reports.length, 'Duplicate report IDs');
const sorted = [...reports].sort((a,b) => a.end.localeCompare(b.end));
assert.equal(sorted.at(-1).id, current.id, 'Seed must be the newest issue');
for(let i=1; i<sorted.length; i++) {
  assert.equal(sorted[i].start, new Date(Date.parse(sorted[i-1].end) + 86400000).toISOString().slice(0,10), 'Weekly archive contains a date gap');
  assert.equal(sorted[i].number, sorted[i-1].number + 1, 'Issue numbering is not consecutive');
}
console.log(`Verified ${reports.length} reviewed issues; schema, windows, numbering and cross-week references passed.`);
