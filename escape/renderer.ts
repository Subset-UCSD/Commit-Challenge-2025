import type { Inventory } from "./util/Inventory";
import type { Item, Stage } from "./util/types";

declare let BEGINNING: Stage;
declare let inventory: Inventory;

const mod = { BEGINNING, inventory };
let current = mod.BEGINNING;

function escape(str:string) {
	return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function renderItem({ name, lore }:Item) {
	// const [name, lore = ''] = itemNameSpec.split('\n')
	return `<span class="item ${lore ? 'has-lore' : ''}" >${name}${lore ? `<span class="lore"><span class="space"> </span>${lore}</span>` : ''}</span>`
}

function renderInventory() {
	if (mod.inventory.size === 0) {
		document.getElementById('inventory')!.innerHTML = ''
		return
	}
	document.getElementById('inventory')!.innerHTML = 'you have: ' + mod.inventory.counts().map(({ item, count }) => renderItem(item) + (count > 1 ? ` (${count})` : '')).join(', ')
}

const render = () => {
	for (let i = 0; i < 87; i++) current() // call the stage 87 times to make sure it's pure
	const { location, description, choices } = current()
	document.title = location
	document.getElementById('location')!.innerHTML = location
	document.getElementById('description')!.innerHTML = description
	document.getElementById('choices')!.innerHTML = Object.keys(choices).map((choice, i) => choices[choice] ? `<button onclick="select(${i})">${choice}</button>` : '').join('')
	renderInventory()
}
const select = (index:number) => {
	for (let i = 0; i < 169; i++) current() // call the stage 169 times to make sure it's pure
	const { location, description, choices } = current()
	const next: any = Object.values(choices)[index];
	const result = next?.()
	if (typeof result === 'string') {
		// "choice thing": () => { do something; return "text to display" }
		// something happened
		document.getElementById('description')!.innerHTML = result
		document.getElementById('choices')!.innerHTML = '<button onclick="render()">ok</button>'
		renderInventory()
	} else if (typeof result === 'function') {
		// "choice thing": () => { do something; return nextStage }
		// something happened
		current = result
		render()
	} else if (result !== null) {
		// "choice thing": nextStage
		// it's probably a state and returned its info object
		current = next
		render()
	}
}
render();

type Health = {
	div: HTMLDivElement
	hp: number
	total: number
}


const attack = document.getElementById('attack') as HTMLButtonElement
const person = document.getElementById('person')!
const enemy = document.getElementById('enemy')!
const myhealth :Health= {
	div:document.getElementById('myhealth') as HTMLDivElement,
hp:100,total:100
}
const theirhealth :Health= {
	div:document.getElementById('therehealth') as HTMLDivElement,
hp:100,total:100
}


export type BattleOptions = {
	/** how quickly player attacks are */
	attackTime:number
	/** how quickly player attacks are */
	attackStrength:number
	/** what to say above the battle */
	description: string
	/** how much health does the player have */
	totalMeHealth: number
	/** how much health enemy has */
	totalEnemyHealth:number
}
let opt: BattleOptions = {
	attackTime:200,
	description:'',attackStrength:3,totalEnemyHealth:100,totalMeHealth:100
}
let onDie = () => {}
function startBattle (options: BattleOptions) {
	opt=options
	myhealth.div.style.setProperty('--health', '100%')
	myhealth.total = opt.totalMeHealth
	myhealth.hp = myhealth.total
	theirhealth.div.style.setProperty('--health', '100%')
	theirhealth.total = opt.totalEnemyHealth
	theirhealth.hp = theirhealth.total
	document.getElementById('battledesc')!.innerHTML=opt.description
	document.getElementById('battle')!.style.display='block'
	document.getElementById('text-based-adventure')!.style.display='none'
	onDie = () => {
		document.getElementById('battle')!.style.display='none'
	document.getElementById('text-based-adventure')!.style.display=''
	}
}

attack.addEventListener('click', () => {
	attack.disabled = true
	setTimeout(() => {
		attack.disabled=  false
	}, opt.attackTime)
	setTimeout(() => {
		const damage = document.createElement('span')
		damage.className = 'damage'
		damage.textContent = `${opt.attackStrength} ow`
		damage.style.transform = `translate(${Math.random() * -100}%, ${Math.random() * 200 - 100}%)`
		enemy.append(damage)
		setTimeout(() => {
			damage.remove()
		}, 500)
		theirhealth.hp-=opt.attackStrength
		if (theirhealth.hp <= 0) {
			setTimeout(onDie, 500)
			onDie = () => {}
			theirhealth.hp=0
		}
		theirhealth.div.style.setProperty('--health', theirhealth.hp/theirhealth.total*100+'%')
	}, opt.attackTime*0.3)
	person.style.animationName = 'none'
	person.style.animationDuration = `${opt.attackTime}ms`
	attack.style.setProperty('--time', `${opt.attackTime}ms`)
	person.getBoundingClientRect() // force reflow to restart animation
	person.style.animationName = 'person-attack'
})


// note: not actively working rn
function save() {
	const state:Record<string, unknown> = Object.fromEntries(Object.entries(mod).filter(([, v]) => typeof v !== 'function'))
	state['current'] = current.name
	// console.log(state)
	return state
}
function load(state: Record<string, any>) {
	current = (mod as Record<string, any>)[state.current]
	delete state.current
	for (const [k, v] of Object.entries(state)) {
		(mod as Record<string, any>)[k] = v
	}
	render()
}