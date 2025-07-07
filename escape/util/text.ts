import { StageInfo, Item } from "./types";

export function randomWord<T extends Record<string, readonly string[]>>(dictionary: T, key: keyof T) {
	return dictionary[key][Math.floor(dictionary[key].length * Math.random())];
}
/**
 * Random dialogue function
 */
export function rd(text: string, chance: number, precondition: boolean = true) {
	return (Math.random() < chance) && precondition ? text : "";
}

export function renderItem({ name, lore }: Item) {
	return `<span class="item ${lore ? "has-lore" : ""}" >${name}${
		lore ? `<span class="lore"><span class="space"> </span>${lore}</span>` : ""
	}</span>`;
}

export function clean(text: string) {
	return text
		.replace(/^\t+/gm, "")
		.replace(/[\t ]+/g, " ");
		//.replace(/\n+/g, "\n")
}

export function shuffleObject<T extends Record<string, any>>(obj: T): T {
	let entries = Object.entries(obj);
	for (let round = 0; round < entries.length; round++) {
		for (let i = entries.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[entries[i], entries[j]] = [entries[j], entries[i]];
		}
	}
	return Object.fromEntries(entries) as T;
}

(()=>{
	if (!customElements.get("t-t")) {
		class TextElement extends HTMLElement {
			constructor() {
				super();
			}
		}
		customElements.define("t-t", TextElement, {extends: "span"});
	}
})();

function type_helper(child: ChildNode, i: number, delayMs: number): [number, string] {
	const c: HTMLElement = (<HTMLElement>child);
	switch (child.nodeType) {
		case Node.TEXT_NODE:
			let res = [...child.textContent!].map(y => {
				let x = `<t-t style="animation-delay: ${i+=delayMs/2}ms;">${y}</t-t>`;
				if (y === ".") i += 8 * delayMs;
				if (y === " ") i += delayMs;
				if (y === ",") i += 4 * delayMs;
				return x;
			}).join("");
			return [i, res];
		case Node.ELEMENT_NODE:
			if (!c.classList.contains("no-type")) {
				let replaced = [...child.childNodes].map(y => {
					let res;
					[i, res] = type_helper(y, i, delayMs);
					return res;
				}).join("");
                                c.textContent = '';
                                c.append(...new DOMParser().parseFromString(replaced, 'text/html').body.childNodes);
				c.style.animationDelay = `${i+=delayMs}ms`;
			}
			return [i, c.outerHTML];
		default:
			console.warn("Not rendering element in your description");
			return [i, ""];
	}
}

export function typeText(text: string, speed: number = 15): [number, string] {
	if (speed === 0) return [0, text];
	const test = document.createElement("div");
        test.textContent = text;
	let i = 0;
	let res = [...test.childNodes].map(c => {
		let res;
		[i, res] = type_helper(c, i, speed);
		return res;
	}).join("");
	return [i, res];
}

export function showChoices(choices: StageInfo["choices"], i_off: number, speed: number) {
	return Object.keys(choices).map((choice, i) => 
		choices[choice] ? 
			`<button ${
				speed === 0 ? 
					`class="no-animate"` :
					""
			} style="animation-delay: ${i_off += 25 * speed}ms" onclick="select(${i})">${choice}</button>` :
			""
	).join("");
}