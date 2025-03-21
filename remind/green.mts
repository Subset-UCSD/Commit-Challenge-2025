// node --experimental-strip-types remind/green.mts [usecached]

import { execSync } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { users } from "./people.mjs";

const [,,usecached] = process.argv

if (usecached && usecached !== 'usecached') {
  console.error()
  console.error('if you\'re gonna use `usecached` at least spell it coreectly lol')
  console.error()
  console.error('> node --experimental-strip-types remind/green.mts usecached')
  console.error()
  process.exit(1)
}

const fmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Los_Angeles',
})

let map: Record<number, Set<string>> = {}

if (usecached === 'usecached') {
  try {
    map = Object.fromEntries(Object.entries(JSON.parse(await readFile('cached.json', 'utf-8'))).map(([keyof,v])=>
    [keyof,new Set(v as any)]))
  } catch {
    console.error('oh norr no cahce avialble.. rip')
  }
}

type Commit = {
  author?: {
    login: string
  }
  commit: {
    author: {
      date: string
    }
  }
}

if (Object.keys(map) .length=== 0){
  let page = 1;
  const perPage = 100; // Maximum allowed per request

  while (true) {
    
  const command = `gh api -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "/repos/Subset-UCSD/Commit-Challenge-2025/commits?per_page=${perPage}&page=${page}"`;
  const commits:Commit[] = JSON.parse(execSync(command, { encoding: "utf8" }));

  if (commits.length === 0) {break}
  console.log(commits.length)


  for (const commit of commits) {
  if (!commit.author) {
    continue
  }
  const {author:{login},commit:{author:{date}}} =commit
  if (!login||login ==='tpowell') {
    continue
  }
  const dateDate = new Date(fmt.format(new Date(date))).getTime() / 1000/60/60/24 + new Date(0).getUTCDay()
  map[dateDate] ??= new Set()
  map[dateDate].add(login)
  }

  page++; // Go to next page
  // break
  }
  // console.log(map)
  // if (usecached === 'usecached') {
    writeFile('cached.json', JSON.stringify(Object.fromEntries(Object.entries(map).map(([keyof,v])=>[keyof, [...v]])),null, '\t'))
  // }
}
const maxContributors = Object.values(map).reduce((cum, curr) => Math.max(cum, curr.size), 0)
const dfgdsgdf =Object.keys(map).map(a => +a).sort((a, b) => a-b)
const startDate = dfgdsgdf[0]
const startDate2 = startDate-new Date(startDate *1000*60*60*24).getUTCDay() //Math.floor((dfgdsgdf[0] - 3) / 7) * 7
const endDate = dfgdsgdf[dfgdsgdf.length-1]

const colors = [

  '#ebedf0',
        '#9be9a8',
        '#40c463',
        '#30a14e',
        '#216e39',
]
const SIZE=10
const SPACE=3

await writeFile('./remind/green.svg', `

<svg height="${SIZE*7 + SPACE*8}" width="${(Math.ceil((endDate + 1 - startDate2) / 7) * (SIZE+SPACE)+SPACE)}" xmlns="http://www.w3.org/2000/svg" fill='#4FA1A7'>
  <style>
  rect {
  rx: 2;
  ry: 2;
  animation: wow .5s backwards;
  }
  .st {
  
  stroke: rgba(27, 31, 35, 0.06);
  stroke-width: 1;
  fill: none;
  }
  @keyframes wow {
  from {opacity: 0;}
  to{ opacity: 1;}}
  ${Array.from({length:maxContributors+1},(_,i)=>`.count${i} {fill: ${i === 0 ? colors[0] : colors[Math.ceil((colors.length - 1) * i/maxContributors)]}}`).join('\n')}
  </style>
${Array.from({length:endDate - startDate + 1}, (_, i) => {
  const date = i + startDate
  const week = Math.floor((date - startDate2) / 7)
  const day = date - startDate2 - week*7
  // let prog = (i / (endDate - startDate))// - 0.5) ** 3 * 4 +.5
  let prog = inverseEaseInOutCubic((i + 0.5) / (endDate - startDate + 1))
  if (day !== new Date(date *1000*60*60*24).getUTCDay()) {
    console.error({date,week,day},new Date(date *1000*60*60*24),new Date(date *1000*60*60*24).getUTCDay(),{startDate,endDate,startDate2})
    throw 'die'
  }
  return `<rect x="${week * (SPACE+SIZE)+SPACE}" y="${day * (SPACE+SIZE)+SPACE}" width="${SIZE}" height="${SIZE}" class="count${map[date]?.size ??0}" style="animation-delay: ${prog * 3000}ms" />`
  + `<rect x="${week * (SPACE+SIZE)+SPACE+0.5}" y="${day * (SPACE+SIZE)+SPACE+0.5}" width="${SIZE-1}" height="${SIZE-1}" class="st" style="animation-delay: ${prog * 3000}ms" />`
}).join('\n')}
</svg>

  `)

  function easeInOutCubic(t:number){
  t *= 2;
  if (t < 1) return t * t * t / 2;
  t -= 2;
  return (t * t * t + 2) / 2;}

  // chatpgt
  function inverseEaseInOutCubic(y: number) {
    if (y < 0.5) {
        return 0.5 * Math.cbrt(2 * y);
    } else {
        return 0.5 * (Math.cbrt(2 * y - 2) + 2);
    }
}


  function easeOutInCubic(t:number) {
    if (t < 0.5) {
        // Ease out cubic for the first half
        return 0.5 * (1 - Math.pow(1 - 2 * t, 3));
    } else {
        // Ease in cubic for the second half
        t = 2 * t - 1;
        return 0.5 * (Math.pow(t, 3) + 1);
    }
}

const users2 = users.map(u => ({...u,count:Object.values(map).filter(s => s.has(u.github)).length}))
.sort((a, b) => b.count - a.count)

let html = `
<meta charset="utf-8" />

    <title>commit stats</title>
    <meta name="description" content="go comit stats">
    <meta name="theme-color" content="#3E7B27">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="icon" type="image/png" href="favicon.png">
<style>
@media (prefers-color-scheme: dark) {
:root {
color-scheme: dark}}
body {
font-family: monospace;
display: flex;flex-wrap: wrap;
margin: 20px;
gap: 20px;
justify-content: center;
align-items: start;
}
table {
border-collapse: collapse}
th,td {
border: 1px solid currentColor;
border-color: color-mix(in srgb, currentColor 20%, transparent)}

.people {
th:first-child {
text-align: left}
td {text-align:center}
th[scope=row] {
font-weight: normal;
    white-space: pre;
    tab-size: ${'Wednesday, '.length}ch;}
    img {
    width: 5ch;height: 5ch}}
</style>

<table class=people>
<thead>
<tr>
<th>date</th>
`
for (const {github,playerName,count} of users2 ) {
  html += `<th>
  <a href="https://github.com/${github}">
  <img src="https://github.com/${github}.png" alt="${playerName} (${github})" title="${playerName} (${github})" width=30 height=30 />
  </a><br>
  (${count})
   </th>
  `
}
html += `</tr>
</thead>
<tbody>
`

const format = new Intl.DateTimeFormat('en-US', {timeZone:'UTC',dateStyle:'full'})
for (let i = startDate; i <= endDate; i++) {
  const date = new Date(i *1000*60*60*24)
  html += `<tr>
  <th scope="row">${format.format(date).replace(' ', '\t')}</th>`
  for (const {github} of users2) {
    html += `<td>${map[i]?.has(github) ? '✅' : ''}</td>`
  }
  html += `</tr>
  `
}

html += `
</tbody>
</table>

<style>
.files tr > :last-child {
text-align: right}
</style>
<table class=files>
<thead>
  <tr>
    <th>file name</th>
    <th>times changed</th>
  </tr>
</thead>
<tbody>
`

https://stackoverflow.com/questions/7686582/finding-most-changed-files-in-git
{}
const fileNames = (execSync(`git log --pretty=format: --name-only`, { encoding: "utf8" }))
.split(/\r?\n/).filter(a => a)

const freq : Record<string,number>={}
for (const file of fileNames) {
  freq[file]??=0
  freq[file]++
}
// console.log(freq)
for (const [file, count] of Object.entries(freq).sort((a, b) => b[1] - a[1]).filter(a => a[1] > 2)) {
  html += `<tr><td>`
  if (/\.(?:html|txt|png|jpg|jpeg|svg)$/.test(file)) {
    if (/(?:^|\/)index\.html$/.test(file)) {
      html += `<a href="./${file.replace('index.html','')}">${file}</a>`
    } else {
      html += `<a href="./${file}">${file}</a>`
    }
  } else {
    html += file
  }
  html += `</td><td>${count}</td></tr>
  `
}

html += `
</tbody>
</table>
`

await writeFile('./stats.html', html)
