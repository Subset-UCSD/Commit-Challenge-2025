import { StageInfo } from "./types";


export function randomWord<T extends Record<string, readonly string[]>>(dictionary: T, key: keyof T) {
	return dictionary[key][Math.floor(dictionary[key].length * Math.random())];
}
/**
 * Random dialogue function
 */
export function rd(text: string, chance: number, precondition: boolean = true) {
	return (Math.random() < chance) && precondition ? text : "";
}

export function clean(text: string) {
	return text
		.replace(/[\t ]+/g, " ")
		.replace(/\n+/g, "\n")
		.replace(/^\s+/gm, "");
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

function openTag(element: HTMLElement) {
    if (!(element instanceof Element)) return "";
    
    let tagName = element.tagName.toLowerCase();
    let attributes = Array.from(element.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(" ");

    return attributes ? `<${tagName} ${attributes}>` : `<${tagName}>`;
}

function type_helper(child: ChildNode, i: number, delayMs: number): [number, string] {
	const c: HTMLElement = (<HTMLElement>child);
	switch (child.nodeType) {
		case Node.TEXT_NODE:
			let res = [...child.textContent!].map(y => {
				let x = `<t-t style="animation-delay: ${i+=delayMs}ms;">${y}</t-t>`;
				if (y === ".") i += 8 * delayMs;
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
				c.innerHTML = replaced;
				c.style.animationDelay = `${i+=delayMs}ms`;
			}
			return [i, c.outerHTML];
		default:
			console.warn("Not rendering element in your description");
			return [i, ""];
	}
}

export function typeText(text: string): [number, string] {
	const test = document.createElement("div");
	test.innerHTML = text;
	let i = 0;
	let res = [...test.childNodes].map(c => {
		let res;
		[i, res] = type_helper(c, i, 15);
		return res;
	}).join("");
	return [i, res];
}

export function showChoices(choices: StageInfo["choices"], i_off: number) {
	return Object.keys(choices).map((choice, i) => 
		choices[choice] ? 
			`<button style="animation-delay: ${i_off += 300}ms" onclick="select(${i})">${choice}</button>` :
			""
	).join("");
}