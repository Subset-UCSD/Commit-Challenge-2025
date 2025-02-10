

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

function type_helper(child: ChildNode): string[] | TypingElem {
	switch (child.nodeType) {
		case Node.TEXT_NODE:
			return child.textContent!.split("").map(y => `<t-t>${y}</t-t>`);
		case Node.ELEMENT_NODE:
			if ((<HTMLElement>child).classList.contains("no-type")) {
				return [(<HTMLElement>child).innerHTML];
			} else {
				return {
					open: openTag(<HTMLElement>child),
					text: [...child.childNodes].map(y=>type_helper(y)),
					close: `</${(<HTMLElement>child).tagName.toLowerCase()}>`
				};
			}
		default:
			return [""];
	}
}

interface TypingElem {
	open: string;
	text: (TypingElem | string[])[]
	close: string;
}

type TypedText = (string[]|TypingElem)[];

function getTypingText(text: string): TypedText {
	const test = document.createElement("div");
	test.innerHTML = text;
	return [...test.childNodes].map(type_helper);
}

function delay(ms: number) {
	return new Promise(res => setTimeout(res, ms));
}
export async function typeText(elem: HTMLElement, text: string) {
	const tt = getTypingText(text);
	let curr: HTMLElement[] = [elem];
	for (let t of tt) {
		if (Array.isArray(t)) {
			for (let char of t) {
				curr.at(-1)!.innerHTML += char;
				await delay(10);
			}	
		} else {
			let temp = document.createElement("template");
			temp.innerHTML = t.open + t.close;
			let elem = <HTMLElement>temp.querySelector("*")!;
			curr.push(elem);
		}
	}
}