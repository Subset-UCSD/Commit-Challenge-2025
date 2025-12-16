import { writeFile } from 'fs/promises'

await writeFile(
  'correct.html',
  await fetch('https://jury.scscourt.org/').then(r => r.text())
)
