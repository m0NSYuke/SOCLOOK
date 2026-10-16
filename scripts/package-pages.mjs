import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const files={};
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else{const key=path.relative('pages-dist',file).replaceAll('\\','/');const content=fs.readFileSync(file,'utf8');files[key]={content,sha256:createHash('sha256').update(content).digest('hex')};}}}
walk('pages-dist');
const report=JSON.parse(fs.readFileSync('app/seed.json','utf8'));
fs.writeFileSync('pages-release.json',JSON.stringify({format:1,issue:report.id,files}));
const list=['app/observatory.tsx','app/schema.ts','app/continuity.ts','app/ai-research.tsx','app/source-inbox.tsx','app/theme.css','app/seed.json','app/history.json','pages-client/index.html','pages-client/main.tsx','pages.config.mjs','postcss.config.mjs','scripts/build-pages.mjs','scripts/package-pages.mjs','scripts/validate-content.mjs','scripts/import-report.mjs','scripts/test-report-import.mjs','scripts/collect_sources.py','scripts/test_collect_sources.py','config/sources.json','.github/workflows/weekly.yml','public/favicon.svg','README.md','UPDATE_GUIDE.md','package.json','package-lock.json','tsconfig.json','.gitignore'];
const source={format:1,files:Object.fromEntries(list.map(file=>[file,fs.readFileSync(file,'utf8')]))};
if(fs.existsSync('data/latest.json')) source.files['data/latest.json']=fs.readFileSync('data/latest.json','utf8');
fs.writeFileSync('pages-source.json',JSON.stringify(source));
console.log(`Packaged SOCLOOK ${report.id}: ${Object.keys(files).length} public files and restorable source.`);
