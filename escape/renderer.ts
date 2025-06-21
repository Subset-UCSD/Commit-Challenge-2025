import { Inventory, setInventory } from "./util/Inventory";
import { typeText, showChoices, renderItem } from "./util/text";
import type { Item, Stage, StageInfo } from "./util/types";
import {wait} from './util/wait'
import { decryptData, encryptData } from './util/security'

// declare let BEGINNING: Stage;
// declare let inventory: Inventory;

const TEXT_SPEED = "textSpeed";

// const mod = { BEGINNING, inventory };
import * as mod from './GAMER'
import inventory from "./util/Inventory";
import { PersistentState } from "./util/persistent-state";
import { loadQuests, SavedQuests, saveQuests } from "./util/QuestManagerFactoryBuilderCreatorFactoryFactoryObserverConflictMediator";
let current = mod.BEGINNING;
const modd: Record<string, (() => StageInfo) | PersistentState<any>>= mod

function escape(str: string) {
	return str.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll(`"`, `&quot;`);
}

function renderInventory() {
	if (inventory.size === 0) {
		document.getElementById("inventory")!.innerHTML = "";
		return;
	}
	document.getElementById("inventory")!.innerHTML = `you have: ${
		inventory.counts().map(({ item, count }) => 
			renderItem(item) + (count > 1 ? ` (${count})` : "")
		).join(", ")
	}`;
}

/**
 * This is used to set ddescription
 */
const render = async () => {
	if ((mod as Record<string, unknown>)[current.name] !== current) {
		console.error(`stage '${current.name}' is not exported from GAMER.ts, so the game state cannot be saved :(`)
	}
	for (let i = 0; i < 87; i++) current() // call the stage 87 times to make sure it's pure
	const textSpeed = parseInt(localStorage.getItem(TEXT_SPEED) || "15");
	const { location, description, inputs, choices, theme = '' } = current();
	document.title = location;
	document.documentElement.className = theme
	document.getElementById("location")!.innerHTML = location;
	let [i, desc] = typeText(description, textSpeed);
	let choice = showChoices(choices, i, textSpeed);
	document.getElementById("description")!.innerHTML = desc;
	if (inputs) document.getElementById("inputs")!.innerHTML = inputs;
	document.getElementById("choices")!.innerHTML = choice;
	renderInventory();
}

const select = (index: number) => {
	if ((mod as Record<string, unknown>)[current.name] !== current) {
		console.error(`stage '${current.name}' is not exported from GAMER.ts, so the game state cannot be saved :(`)
	}
	for (let i = 0; i < 169; i++) current(); // call the stage 169 times to make sure it's pure
	const { choices } = current();
	const next: any = Object.values(choices)[index];
	const result = next?.()
	if (typeof result === "string") {
		// "choice thing": () => { do something; return "text to display" }
		// something happened
		const textSpeed = parseInt(localStorage.getItem(TEXT_SPEED) || "15");
		let [i, desc] = typeText(result, textSpeed);
		document.getElementById("description")!.innerHTML = desc;
		document.getElementById("choices")!.innerHTML = `<button onclick="render()" style="animation-delay: ${i}ms">ok</button>`;
		renderInventory();
	} else if (typeof result === "function") {
		// "choice thing": () => { do something; return nextStage }
		// something happened
		current = result;
		render();
	} else if (result !== null) {
		// "choice thing": nextStage
		// it's probably a state and returned its info object
		current = next;
		render();
	}
}
window.requestAnimationFrame(render)

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
	/** how quickly enemy attacks are (set to `Infinity` to disable) */
	theirattackTime:number
	/** how quickly enemy attacks are */
	theirattackStrength:number
	/** what to say above the battle */
	description: string
	/** how much health does the player have */
	totalMeHealth: number
	/** how much health enemy has */
	totalEnemyHealth:number
	/** whether the player should hold a stick */
	hasWeapon: boolean
	/** path to enemy image */
	enemyImage: string
	/** path to player attack sound */
	myAttackSound: string
	/** path to enemy attack sound */
	theirAttackSound: string
}
let opt: Pick<BattleOptions, 'attackTime'|'attackStrength'|'myAttackSound'> = {
	attackTime:200,
	attackStrength:3,//theirattackStrength:200,theirattackTime:Infinity
	myAttackSound: '../ass/ets/hit-slap.mp3',
}
let onDie = () => {}
export async function startBattle (options: BattleOptions) {
	opt=options
	myhealth.div.style.setProperty('--health', '100%')
	myhealth.total = options.totalMeHealth
	myhealth.hp = myhealth.total
	theirhealth.div.style.setProperty('--health', '100%')
	theirhealth.total = options.totalEnemyHealth
	theirhealth.hp = theirhealth.total
	enemy.querySelector('img')!.src = options.enemyImage
	person.className = options.hasWeapon ? 'armed':''
	document.getElementById('battledesc')!.innerHTML=options.description
	document.getElementById('battle')!.style.display='block'
	document.getElementById('text-based-adventure')!.style.display='none'
	onDie = () => {
		document.getElementById('battle')!.style.display='none'
	document.getElementById('text-based-adventure')!.style.display=''
	}

	if (options.theirattackTime < Infinity) {
		while (myhealth.hp > 0 && theirhealth.hp > 0) {
			const animationTime = Math.max(options.theirattackTime)
			enemy.style.animationName = 'none'
			enemy.style.animationDuration = `${animationTime}ms`
			enemy.getBoundingClientRect() // force reflow to restart animation
			enemy.style.animationName = 'enemy-attack'

			await wait(animationTime*0.3)

			new Audio(options.theirAttackSound).play()
			const damage = document.createElement('span')
			damage.className = 'damage'
			damage.textContent = `${options.theirattackStrength} ow`
			damage.style.transform = `translate(${Math.random() * -100}%, ${Math.random() * 200 - 100}%)`
			person.append(damage)
			setTimeout(() => {
				damage.remove()
			}, 500)
			myhealth.hp-=options.theirattackStrength
			if (myhealth.hp <= 0) {
				myhealth.hp=0
				// you die
				attack.disabled = true
				attack.style.animationPlayState = 'paused'
			}
			myhealth.div.style.setProperty('--health', myhealth.hp/myhealth.total*100+'%')

			await wait(options.theirattackTime-animationTime*0.3)
		}
	}
}

// window.addEventListener('DOMContentLoaded', () => {
// });
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
speedSlider.addEventListener("input", (event) => {
event.preventDefault();
localStorage.setItem("textSpeed", (-parseInt((event.target as HTMLInputElement).value)).toString());
render();
});
speedSlider.valueAsNumber = -(localStorage.getItem(TEXT_SPEED) || "15")

export function removeInput() {
	const inputElement = document.getElementById("password-input") as HTMLInputElement;
	inputElement?.remove();
}

attack.addEventListener('click', () => {
	attack.disabled = true
	setTimeout(() => {
		if (attack.style.animationPlayState !== 'paused')
		attack.disabled=  false
	}, opt.attackTime)
	setTimeout(() => {
		new Audio(opt.myAttackSound).play()
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

const saveWindow = document.getElementById('save-thing')! as HTMLDialogElement
const savesList = document.getElementById('savers')!
// const saveBtn  = document.getElementById('buton')!
// const saveform = document.getElementById('saveform')! as HTMLFormElement
const loadonly = document.getElementById('loadonly')!
const savename = document.getElementById('name')! as HTMLInputElement

const fmt =new Intl.DateTimeFormat([],{dateStyle:'long',timeStyle:'short'})
function openSaveLoad(mode: 'save'|'load') {
	saveWindow.showModal()
	// const 
	const saves:{name:string,time:Date,loc:string}[]=[]
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key===null)continue
		try {
			const state = decryptData<GameState>(localStorage.getItem(key)??'')
			const stage = modd[state.stage]
			saves.push({name:key,time:new Date(state.saved),loc:stage instanceof Function ? stage().location : 'unknown'})
		} catch {

		}
	}
	// xss vuln
	savesList.innerHTML = saves.map(s => `<li><button value="x${escape(s.name)}" >${mode}</button> <strong>${escape(s.name)}</strong> (in ${escape(s.loc)}; ${fmt.format(new Date())})</li>`).join('')
	saveWindow.onclose = () => {
		console.log(mode,saveWindow.returnValue)
		let key
		if (saveWindow.returnValue[0] === 'x') {
			key = saveWindow.returnValue.slice(1)
		} else if (saveWindow.returnValue[0] === 's') {
			key = savename.value
		} else {
			return
		}
		if (mode === 'save') {
			localStorage.setItem(key, save())
		} else {
			try {
				load(localStorage.getItem(key)??'')
			} catch (error) {
				console.error(error)
				if (error instanceof Error)alert(error.message)
			}
		}
	}
	loadonly.style.display = mode === 'save'?'':'none'
	if (mode==='save'){
		savename.focus()
		savename.value=''
	}
	// saveBtn.textContent = mode
}
document.getElementById('save')?.addEventListener('click', ( ) => {openSaveLoad('save')
})
document.getElementById('load')?.addEventListener('click', ( ) => {
	openSaveLoad('load')
})

type GameState = {
	stage: string
	inventory: Item[]
	quests: SavedQuests
	saved: number
	state: Record<string, unknown>
}
function save() {
	const state:Record<string, unknown> = Object.fromEntries(Object.entries(modd).flatMap(([k, v]) =>v instanceof PersistentState?[ [k, v.value]]:[]))
	// state['_current'] = current.name
	// state['_inventory'] = inventory.toJSON()
	// state['_quests'] = saveQuests()
	// state['_savedDate'] = Date.now()
	// console.log(state)
	return encryptData<GameState>({
		stage:current.name,
		inventory:inventory.toJSON(),
		quests:saveQuests(),
		saved:Date.now(),
		state,
	})
}
function load(stateData: string) {
	const state = decryptData<GameState>(stateData)
	const currentStage = modd[state.stage]
	if (currentStage instanceof Function) {
		current = currentStage
	} else {
		// console.error('missing stage', state['_current'])
		throw new Error(`missing stage ${state.stage}`)
	}
	setInventory(state.inventory)
	loadQuests(state.quests)

	for (const [k, v] of Object.entries(state.state)) {
		if (modd[k] instanceof PersistentState) {
			modd[k].value = v
		} else {
			console.warn('Missing persistent state:', k,'=', v)
		}
	}
	render();
}

Object.assign(window,{select,render,
	save,load

})
