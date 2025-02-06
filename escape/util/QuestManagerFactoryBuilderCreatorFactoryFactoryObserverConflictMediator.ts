
type Quest = {
  html: string
  li: HTMLLIElement
  checkbox:HTMLInputElement
}

const questsList = document.getElementById('quests') as HTMLUListElement
const quests: Quest[] = []
const completed: string[] = []

export function addQuest (questHtml: string, allowRepeat = false) {
  if (!allowRepeat&& completed.includes(questHtml)) {
    
    console.error(' quest',questHtml, 'alr completed')
    return}
  if (quests.some(q => q.html === questHtml)) {
    
    console.error(' quest',questHtml, 'alr exists')
    return}
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
  li.innerHTML = questHtml
  li.prepend(checkbox, ' ')
  questsList.prepend(li)
  quests.push({
    html:questHtml,li,checkbox
  })
}

export function resolveQuest (questHtml: string) {
  const qi = quests.findIndex(q => q.html === questHtml)
  if (qi === -1) {
    console.error('cannot find quest',questHtml)
    return}
    const q= quests[qi]
    q.checkbox.checked = true
    q.li.classList.add('done')
q.checkbox.onclick = () => q.li.remove()
quests.splice(qi)
completed.push(q.html)
}

export function hasQuest (questHtml:string) {
  return quests.some(q => q.html === questHtml)
}
