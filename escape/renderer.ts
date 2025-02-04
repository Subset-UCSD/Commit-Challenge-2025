declare let BEGINNING: any;
declare let inventory: any;

const mod = { BEGINNING, inventory };
let current = mod.BEGINNING;

function escape(str) {
	return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function renderItem({ name, lore }) {
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
const select = index => {
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
// note: not actively working rn
function save() {
	const state = Object.fromEntries(Object.entries(mod).filter(([, v]) => typeof v !== 'function'))
	state.current = current.name
	// console.log(state)
	return state
}
function load(state) {
	current = mod[state.current]
	delete state.current
	for (const [k, v] of Object.entries(state)) {
		mod[k] = v
	}
	render()
}