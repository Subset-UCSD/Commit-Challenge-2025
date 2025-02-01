

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