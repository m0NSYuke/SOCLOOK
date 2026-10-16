import { createRoot } from 'react-dom/client';
import Observatory from '../app/observatory';
import { reportSchema } from '../app/schema';
import seed from '../app/seed.json';
import history from '../app/history.json';
import '../app/theme.css';
const reports=[seed,...history].map(r=>reportSchema.parse(r)).sort((a,b)=>b.end.localeCompare(a.end));
createRoot(document.getElementById('root')!).render(<Observatory initialReports={reports} staticMode/>);
