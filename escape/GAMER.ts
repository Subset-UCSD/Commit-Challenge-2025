/** 
 * Each stage should be a PURE function, so expect it to be called many times.
 * If you want to change game state, do it in `choices`.
 */
type Stage = () => StageInfo;

interface StageInfo {
	/** 
	 * Short description of where the player is. Displayed at the top and in the
	 * tab title. Can use HTML.
	 */
	location: string
	/**
	 * Text shown before the choices. Can use HTML.
	 */
	description: string
	/**
	 * An object mapping from a string label (which can use HTML) to a function.
	 * The function can either be
	 *
	 * - another stage (i.e. a PURE FUNCTION)
	 *
	 * - a function that returns a string or a stage (i.e. a function returning
	 *   function). use this for any game state changes, like adding items to an
	 *   inventory.
	 *
	 *   Return value:
	 *   - string -> it will be displayed (can use HTML) with a single choice "ok"
	 *     to return back to the same stage.
	 *   - stage -> it will run the action then display the stage
	 *   - null -> indicates we are exiting "choose-your-own-adventure" mode
	 *
	 * Specifying a choice of `null` will hide the choice. This can be used to
	 * specify the order of the choices in the object but programmatically
	 * show/hide them later in the function.
	 */
	choices: {
		[choiceLabel: string]: Stage | (() => string | Stage | null) | null
	}
}

type Item = {
	/** 
	 * Should serve as both the ID and display name of the item. If we want to
	 * separate the two, we can add an optional `displayName` property in the
	 * future.
	 * 
	 * Can use HTML.
	 */
	name: string
	/**
	 * Can use HTML.
	 */
	lore?: string
}

class Inventory {
	#contents: Item[] = []

	static #same (a: Item, b: Item | string) : boolean {
		return typeof b === 'string' ? a.name === b : a.name === b.name && a.lore === b.lore
	}

	/**
	 * Whether the player has `count` of `item`.
	 * @param item Item name or object. Objects are compared by value not reference
	 * @param count Defaults to 1.
	 */
	has (item: string|Item, count = 1): boolean {
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
	add (...items: (Item | Item[])[]): void {
this.#contents.push(...items.flat())
	}

	/** 
	 * Removes `count` of `item` from inventory.
	 * @param item Item name or object. Objects are compared by value not reference
	 * @param count Defaults to 1. Set to Infinity to remove all of `item`.
	 * @returns Number of items removed, which may be less than `count` if the
	 * inventory doesn't have that many items.
	 */
	remove (item: string|Item, count = 1): number {
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
	counts (): {item:Item, count:number}[] {
		const groups: Record<string, Item[]> = {}
		for (const item of this.#contents) {
			const id = `${item.name}\n${item.lore}`
			groups[id] ??= []
			groups[id].push(item)
		}
		return Object.values(groups).map(arr => ({item:arr[0], count:arr.length}))
	}

	/** Number of items in inventory */
	get size () :number{
		return this.#contents.length
	}

	/** empties inventory */
	clear () :void{
		this.#contents=[]
	}
}

let inventory = new Inventory();

function BEGINNING(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ?"Ravensmith Court": "courtyard",
		description: "you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south. ",
		choices: {
			"go north": northPath,
			"go south": southPath,
			"go east": null,
			'inspect fountain': rubberRoom1,
		}
	};
	if (inventory.size === 0) {
		I.description += "you have no memory , no items in hand. ";
	}
	if (inventory.has(mapItem)) {
		I.choices["go east"] = () => {
			return "the map says theres nothing to the east. <a href=\"https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/escape/GAMER.ts\">for now...</a>";
		};
	}
	return I;
}

const grassItem:Item = {name:"blade of grass",lore:"It's just a blade of grass."};
let talkedToRaven = false
let ravenCompassTaken = false
const mapItem:Item = {name:"Ravensmith Estate map",lore:"a somewhat blurry photocopy of a map of Ravensmith's estate. scribbles and notes dot the map, but few are legible."}
const compassItem: Item = {name:"compass", lore:"invented by the chinese in 206 BCE."}
function northPath(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem)?"Unnamed Field on Ravensmith Estate":"field",
		description: "the path trails off, leaving you standing on a field of uncut grass. ",
		choices: {
			"continue north": null,
			"go south": BEGINNING,
		},
	};
	if (inventory.has(mapItem)) {
		I.description += "empowered by the map, you feel ready to venture into the fog. "
		I.choices[
			"continue north"] = fieldMan
	} else {
		I.choices[
			"continue north"] = () => {
				return "you do not wish to stray from the path. in the fog, it is easy to get lost."
			}
	}
	if (!talkedToRaven) {
	I.description += "a raven dressed in a long, dark trenchcoat shivers in the cold. "
		I.choices["talk to raven"] = () => {
			talkedToRaven = true
			inventory.add(mapItem)
			return "the raven's name is Ravensmith. he apparently owns this property. since you're trespassing, he gives you a map for more accurate trespassery. +1 map"
		}
	} else {
		I.description += "Ravensmith, dressed in a long, dark trenchcoat, shivers in the cold. "
		if (!ravenCompassTaken) {
			I.description += "a small, round object protrudes from his pocket. a compass, perhaps? "
		}
		if (!inventory.has(sushiItem)||ravenCompassTaken) {
				I.choices["talk to Ravensmith"] = () => {
					return "Ravensmith does not bother with small talk. he humphs at you and turns his head away. "
				}
			} else {
				I.choices["talk to Ravensmith"] = () => {
					inventory.add(compassItem)
					inventory.remove(sushiItem, 1);
					ravenCompassTaken = true;
					return "you ask for his compass, offering a piece of sushi. he obliges. +1 compass "
				}
			}
	}
	if (Math.random() < 0.5) {
		I.choices["pick grass"] = () => {
			inventory.add(grassItem)
			return "you pluck a blade of grass from the ground. +1 blade of grass.";
		}
	} else {
		
		I.choices["pick grass"] =() => {
				let myDiv = document.getElementById("text-based-adventure")!;
				myDiv.className = "GO_AWAY";
				myDiv = document.getElementById("rpg-battle")!;
				myDiv.className = "no-come-back-i-am-sorry";
				return null
		};
	}  
	return I;
}

const fishItem:Item = {name:"fish",lore:"a frozen fish wrapped in plastic on a styrofoam plate. its label says it's from winco."};
const spermPosterItem:Item = {name:"sperm donor poster",lore:"it says \"become a sperm donor!\" theres a nice man smiling and pointing at top 3 reasons to start donating."};
let spermDonorPoster = true;
let wincoFish = true;
function southPath(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Ravensmith Estate Wall": "brick wall",
		description: "the path abruptly ends at a brick wall. you jump to look over, but all you see is fog. ",
		choices: {
			"go north": BEGINNING,
		},
	}
	if (wincoFish) {
		I.description += "there is a frozen fish wrapped in plastic at the base of the wall. the packaging says it's from winco. ";
		I.choices["take fish"] = () => {
			inventory.add(fishItem);
			wincoFish = false;
			return "you put the fish in your pocket. +1 fish.";
		}
	}
	if (spermDonorPoster) {
		I.description += "there is a sperm donor poster on the wall. a handsome man smiles at you and beckons for your sperm. ";
		I.choices["take sperm donor poster"] = () => {
			inventory.add(spermPosterItem)
			spermDonorPoster = false
			return "you carefully rip off the poster, revealing a hole just large enough for you to crawl through. +1 poster.";
		}
	} else {
		I.description += "theres a sizeable hole on the wall where the poster once was. ";
		I.choices["enter hole"] = () => {
			return {
				location: "hole",
				description: "the hole reveals a dead end.",
				choices: {
					"Ok": southPath,
					"enter dead end": labyrinthEntrance
				}
			}
		};
	}
	return I;
}

const sushiItem :Item= {name:`sushi piece`,lore:`a slice of sushi. the man who made it seemed to be a professional sushi guy or whatever the word is. raw tuna wrapped in seaweed wrapped in sticky rice. did you know? Ravensmith is a big fan of sushi.`};
let manHungry = true;
function fieldMan(): StageInfo {
	let I: StageInfo = {
		location:inventory.has(mapItem)?"Private Property - DO NOT TRESPASS!":  "field",
		description: "you trudge on blindly into the endless grassland. suddenly, you spot a man, huddled in tattered clothes lying on the ground. ",
		choices: {
			"return south": northPath,
		},
	};
	if (inventory.has(fishItem) && manHungry) {
		I.description += 'he sees the fish sticking out of your back pocket and shakily holds a finger up to it. he offers to turn it into sushi. ';
		I.choices["give fish to man"] = () => {
			// manState = 'full'
			inventory.remove(fishItem, 1);
			for (let i = 4;i--;) inventory.add(sushiItem);
			manHungry = false;
			return "bro snatches your fish, tears off the plastic with his teeth, and in a show beyond your comprehension, you find yourself being served a plate of sushi. he has cut the roll into eight slices and graciously tipped himself half of them, which he voraciously stuffs into his mouth. he burps, yawns, and falls asleep. +4 sushi pieces. ";
		};
	} else if (manHungry) {
		I.description += "the man stares as you, and you stare back. his stomach grumbles. ";
	} else {
		I.description += "he is soundly asleep, snoring a cacophony. ";
	}
	return I;
}

function rubberRoom1(): StageInfo {
	if (rubberloops>MAX_LOOPS_RUBBER) {
	return {
		location: inventory.has(mapItem) ?"Ravensmith Court":'courtyard',
		description: 'you slip and fall into the fountain, again. grasping for breath, you frantically try to paddle out, only to realize the water is only up to your knees.',
		choices: {'climb out': BEGINNING}
	};
	} else {
	return {
		location: inventory.has(mapItem) ?"Ravensmith Court":'courtyard',
		description: 'you slip and fall into the fountain. grasping for breath, you frantically try to paddle out, but feel yourself sinking further into the murky water.',
		choices: {'fall': rubberRoom2}
	};
	}
}

// content warning: bad formatting

// dont say i warned you!!

// 🤢🤢🤢🤢🤮🤮🤮🤮🤮🤮

function rubberRoom2():                                                                             StageInfo{
   return                                                                                           {
      location: '???'                                                                               ,
      description:
         'your vision begins to fade as your lungs give way, water gushing into your body.'         ,
      choices: {'fall': rubberRoom3}                                                                };}

function rubberRoom3(): StageInfo
{ return { location: '???'
         , description: 'you wake up.'
         , choices: {'where am i?': rubberRoom}
         }
}
const MAX_LOOPS_RUBBER = 9
let rubberloops = 0
function rubberRoom(): StageInfo {
	return {
		location: 'rubber room',
		description: '..a rubber room with rats. and rats make you crazy.',
		choices: {'crazy?':rubberloops>MAX_LOOPS_RUBBER?rubberRoomExit1: () => {
			rubberloops += 1
			return 'i was crazy once. they locked me in a room.'
		}}
	};
}
function rubberRoomExit1(): StageInfo {
	return {
		location: 'rubber room',
		description: 'i was crazy once. they locked me in a room.',
		choices: {'a rubber room?': rubberRoomExit2}
	};
}
function rubberRoomExit2(): StageInfo {
	return {
		location: 'rubber room',
		description: '..a rubber room with rats, yes. and rats...',
		choices: {'make me crazy': BEGINNING}
	};
}


function pl(d: Dire) {
	if (labyrinthState.length >= l_diff) {
		labyrinthState.shift();
	}
	labyrinthState.push(d);
}

const Dir = {
	N: "north",
	E: "east",
	S: "south",
	W: "west"
} as const satisfies Record<string, string>;
type Dire = (typeof Dir)[keyof typeof Dir]

let labyrinthState: Dire[] = [];
let l_diff = 8;
let labyrinthSol = Array(l_diff).fill(0).map(_=>Object.values(Dir)[Math.floor(Math.random()*Object.values(Dir).length)]);
function labyrinthEntrance(): StageInfo {
	let I: StageInfo = {
		location: "courtyard",
		description: `you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south...\n\nwait, were those paths there before?\n`,
		choices: {
			"go north": _exp(Dir.N),
			"go south": _exp(Dir.S),
			"go east": _exp(Dir.E),
			"go west": _exp(Dir.W)
		},
	};
	if (inventory.size === 0) {
		I.description += "you have no memory , no items in hand. ";
	}
	return I;
}
function labyrinthDir(): StageInfo {
	let I: StageInfo = {
		location: "courtyard?",
		description: clean(`you ${t("walk")} ${labyrinthState.at(-1)}. 
			${rd("the walls of the courtyard seem to have grown taller...", 1, labyrinthState.length == 1)}
			${rd("is it just you, or is the architecture becoming more... brutalist?", 1, labyrinthState.length == 2)}
			${rd("thick vines creep up the walls. seems like you are thoroughly lost...", 1, labyrinthState.length == 3)}
			${""}
		${rd("you feel like you've been this way before..." + rd("or have you?", 0.5), 0.3, labyrinthState.length == l_diff)} ${
			rd(`you see a ${t("material")} statue of a ${t("animal")} ${t("location")}`, 0.2, labyrinthState.length == l_diff)
			}`),
		choices: shuffleObject({
			"go north": _exp(Dir.N),
			"go south": _exp(Dir.S),
			"go east": _exp(Dir.E),
			"go west": _exp(Dir.W)
		}),
	};
	return I;
}
const _exp = (d: Dire) => {pl(d);return labyrinthDir}

function shuffleObject<T extends Record<string, any>>(obj: T): T {
	let entries = Object.entries(obj);
	for (let round = 0; round < 3; round++) {
		for (let i = entries.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[entries[i], entries[j]] = [entries[j], entries[i]];
		}
	}
	return Object.fromEntries(entries) as T;
}
	

const words = {
	"walk": [
		"stumble", "walk", ""
	],
	"animal": [
		"raven", "boar", "horse", "dolphin", "carp", "gargoyle", "john cena"
	],
	"material": [
		"stone", "tarnished bronze", "marble", "rusted copper", "glass"
	],
	"location": [
		"nestled among the vines", "atop a pillar", "buried in the mud", "sunken in a small puddle"
	]
} as const;

function t(key: keyof typeof words) {
	return words[key][Math.floor(words[key].length*Math.random())];
}
/**
 * Random dialogue part
 */
function rd(text: string, chance: number, precondition: boolean = true) {
	return (Math.random() < chance) && precondition ? text : "";
}

function clean(text: string) {
	return text
		.replace(/[\t ]+/g, " ")
		.replace(/\n+/g, "\n")
		.replace(/^\s+/gm, "");
}