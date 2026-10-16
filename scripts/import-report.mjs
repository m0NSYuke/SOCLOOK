import {readFileSync, writeFileSync} from 'node:fs';
import {reportSchema} from '../app/schema.ts';
import {validateArchive} from '../app/continuity.ts';

const file = process.argv[2];
if(!file) throw Error('Usage: npm run import-report -- path/to/reviewed-report.json');
const incoming = reportSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
const seed = reportSchema.parse(JSON.parse(readFileSync('app/seed.json', 'utf8')));
const history = JSON.parse(readFileSync('app/history.json', 'utf8')).map(r => reportSchema.parse(r));
if(incoming.end < seed.end) throw Error('Import cannot overwrite a historical issue');
if(incoming.end === seed.end) {
  if(incoming.number !== seed.number || incoming.start !== seed.start) throw Error('Retry must preserve issue number and window');
} else {
  const nextStart = new Date(Date.parse(seed.end) + 86400000).toISOString().slice(0,10);
  if(incoming.start !== nextStart || incoming.number !== seed.number + 1) throw Error('New issue must immediately follow the latest issue');
}
const nextHistory = [...history, ...(incoming.end === seed.end ? [] : [seed])];
const errors = validateArchive([incoming, ...nextHistory]);
if(errors.length) throw Error(errors.join('\n'));
writeFileSync('app/history.json', JSON.stringify(nextHistory, null, 2) + '\n');
writeFileSync('app/seed.json', JSON.stringify(incoming, null, 2) + '\n');
console.log(`Imported reviewed issue ${incoming.id}; ${nextHistory.length} earlier issues preserved.`);
