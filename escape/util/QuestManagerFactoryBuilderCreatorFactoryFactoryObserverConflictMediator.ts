
type Quest = {
  html: string
  li: HTMLLIElement
  checkbox:HTMLInputElement
}

const questsList = document.getElementById('quests') as HTMLUListElement
let quests: Quest[] = []
let completed: string[] = []

function createQuest (questHtml:string) : Quest{
  const li = document.createElement('li')
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.onclick= e => {
    // console.log(checkbox,checkbox.checked)
    // if (checkbox.checked ) {
    //   li.remove()
    // } else {
      e.preventDefault()
      const wow = document.createElement('div')
    wow.textContent = '👎 Nope'
    wow.className = 'nope'
    document.body.append(wow)
    setTimeout(() => {
      wow.remove()
    }, 1000)
    }
  // })
  li.textContent = ''
  li.append(...new DOMParser().parseFromString(questHtml, 'text/html').body.childNodes)
  li.prepend(checkbox, ' ')
  return {
    html:questHtml,li,checkbox
  }
}
function markQuestResolved(q:Quest) {
  q.checkbox.checked = true
    q.li.classList.add('done')
q.checkbox.onclick = () => {
  q.li.remove()
  completed = completed.filter(qq => qq !== q.html)
}
}
export function addQuest (questHtml: string, allowRepeat = false) {
  if (!allowRepeat&& completed.includes(questHtml)) {
    
    console.error(' quest',questHtml, 'alr completed')
    return}
  if (quests.some(q => q.html === questHtml)) {
    
    console.error(' quest',questHtml, 'alr exists')
    return}
  const q=createQuest(questHtml)
  questsList.prepend(q.li)
  quests.push(q)
}

export function resolveQuest (questHtml: string) {
  const qi = quests.findIndex(q => q.html === questHtml)
  if (qi === -1) {
    console.error('cannot find quest',questHtml)
    return}
    const q= quests[qi]
    markQuestResolved(q)
quests.splice(qi)
completed.push(q.html)
}

export function hasQuest (questHtml:string) {
  return quests.some(q => q.html === questHtml)
}

export type SavedQuests = {
  quests: string[]
  completed: string[]
}
export function saveQuests(): SavedQuests {
  return {quests:quests.map(q => q.html),completed}
}
export function loadQuests(data:SavedQuests):void {
  // console.log(data)
  quests=[]
  completed=data.completed
  while (questsList.lastChild)questsList.removeChild(questsList.lastChild)
  for (const html of data.quests) {
    // if (completed.includes(html)){continue}
    const q = createQuest(html)
    // markQuestResolved(q)
    quests.push(q)
    questsList.append(q.li)
  }
  for (const html of completed) {
    // if (!data.quests.includes(html)){continue}
    const q = createQuest(html)
    markQuestResolved(q)
    quests.push(q)
    questsList.append(q.li)
  }
}
