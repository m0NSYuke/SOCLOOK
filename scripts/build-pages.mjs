import { build } from 'vite';
import { readFileSync,writeFileSync,copyFileSync,existsSync } from 'node:fs';
await build({configFile:'pages.config.mjs'});
const reports=[JSON.parse(readFileSync('app/seed.json','utf8')),...JSON.parse(readFileSync('app/history.json','utf8'))];
writeFileSync('pages-dist/reports.json',JSON.stringify({reports},null,2));
if(existsSync('data/latest.json')) copyFileSync('data/latest.json','pages-dist/collection.json');
copyFileSync('public/favicon.svg','pages-dist/favicon.svg');
writeFileSync('pages-dist/.nojekyll','');
console.log('SOCLOOK static build complete; only public reports included.');
