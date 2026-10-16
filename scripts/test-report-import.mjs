import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const scratch = mkdtempSync(path.join(tmpdir(), 'soclook-import-'));
const run = file => spawnSync(process.execPath, ['--experimental-strip-types', path.join(root, 'scripts/import-report.mjs'), file], {cwd:scratch, encoding:'utf8'});
try {
  mkdirSync(path.join(scratch, 'app'));
  const current = JSON.parse(readFileSync(path.join(root, 'app/seed.json'), 'utf8'));
  const history = JSON.parse(readFileSync(path.join(root, 'app/history.json'), 'utf8'));
  const save = (name, data) => writeFileSync(path.join(scratch, name), JSON.stringify(data));
  save('app/seed.json', current); save('app/history.json', history); save('incoming.json', current);
  assert.equal(run('incoming.json').status, 0, 'Same-issue retry should succeed');
  assert.equal(JSON.parse(readFileSync(path.join(scratch, 'app/history.json'))).length, history.length, 'Retry must not duplicate history');
  const addDays = (day, count) => new Date(Date.parse(day) + count * 86400000).toISOString().slice(0,10);
  const next = structuredClone(current);
  next.id = next.end = addDays(current.end, 7); next.start = addDays(current.end, 1); next.number++;
  next.events = [{...current.events[0], id:'import-test-new-evidence', published:next.start, date:next.start, fact:'New evidence for importer verification.', changeType:'首次出现', previousEventIds:[], relatedEventIds:[]}];
  save('incoming.json', next);
  assert.equal(run('incoming.json').status, 0, 'Next contiguous issue should import');
  const stored = JSON.parse(readFileSync(path.join(scratch, 'app/history.json')));
  assert.deepEqual(stored.at(-1), current, 'Previous issue must survive unchanged');
  const before = readFileSync(path.join(scratch, 'app/seed.json'), 'utf8');
  const invalid = structuredClone(next); invalid.id = invalid.end = addDays(next.end, 7); invalid.number++; invalid.start = addDays(next.end, 2);
  save('incoming.json', invalid);
  assert.notEqual(run('incoming.json').status, 0, 'Date gaps must fail');
  assert.equal(readFileSync(path.join(scratch, 'app/seed.json'), 'utf8'), before, 'Failed import must preserve current issue');
  save('incoming.json', current);
  assert.notEqual(run('incoming.json').status, 0, 'Historical overwrite must fail');
  console.log('Report import verified: retry, historical preservation, gap rejection and rollback protection.');
} finally {
  // scratch is an exact path returned by mkdtemp under the OS temporary directory.
  assert(path.resolve(scratch).startsWith(path.resolve(tmpdir()) + path.sep));
  rmSync(scratch, {recursive:true, force:true});
}
