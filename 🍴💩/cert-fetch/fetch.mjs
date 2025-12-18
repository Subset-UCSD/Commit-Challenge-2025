import { writeFile } from 'fs/promises';

await writeFile(
  'fetched.html',
  await fetch('https://jury.scscourt.org/').then(r => r.text())
);
