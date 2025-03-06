// node --experimental-strip-types remind/green.ts

import { execSync } from "child_process";
import { writeFile } from "fs/promises";

const fmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Los_Angeles',
})

const map: Record<number, Set<string>> = {}

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

console.log(map)
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
