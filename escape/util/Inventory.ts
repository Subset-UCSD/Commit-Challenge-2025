import type { Item } from "./types"

export class Inventory {
	#contents: Item[] 

	constructor (contents: Item[] = []) {
		this.#contents=contents
	}

	static #same(a: Item, b: Item | string) : boolean {
		return typeof b === 'string' ? a.name === b : a.name === b.name
	}

	/**
	 * Whether the player has `count` of `item`.
	 * @param item Item name or object. Objects are compared by value not reference
	 * @param count Defaults to 1.
	 */
	has(item: string|Item, count = 1): boolean {
		let found = 0
		for (const myitem of this.#contents)  {
			if (Inventory.#same(myitem,item)) {
				found++
				if (found>=count){return true}
			}
		}
		return false
	}

	/** Adds all items to the inventory */
	add(...items: (Item | Item[])[]): void {
		this.#contents.push(...items.flat())
	}

	/** 
	 * Removes `count` of `item` from inventory.
	 * @param item Item name or object. Objects are compared by value not reference
	 * @param count Defaults to 1. Set to Infinity to remove all of `item`.
	 * @returns Number of items removed, which may be less than `count` if the
	 * inventory doesn't have that many items.
	 */
	remove(item: string|Item, count = 1): number {
		let removed = 0
		for (let i = this.#contents.length; i--;) {
			const myitem = this.#contents[i]
			if (Inventory.#same(myitem,item)) {
				this.#contents.splice(i, 1)
				removed++
				if (removed>=count)break
			}
		}
		return removed
	}

	/**
	 * Groups items by name, lore, etc. with the count
	 */
	counts(): {item:Item, count:number}[] {
		const groups: Record<string, Item[]> = {}
		for (const item of this.#contents) {
			const id = `${item.name}\n${item.lore}`
			groups[id] ??= []
			groups[id].push(item)
		}
		return Object.values(groups).map(arr => ({item:arr[0], count:arr.length}))
	}

	/** Number of items in inventory */
	get size() :number{
		return this.#contents.length
	}

	/** empties inventory */
	clear() :void{
		this.#contents=[]
	}

	toJSON () : Item[] {
		return this.#contents
	}
	
}

let inventory = new Inventory();
export default inventory;
export function setInventory (items: Item[]) {
	inventory = new Inventory(items)
}
