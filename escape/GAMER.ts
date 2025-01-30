let inventory: string[] = [];

type Stage = () => StageInfo

/** 
 * Each stage should be a PURE function (changes to game state should be done in
 * choice functions, see below). The choices' functions don't need to pure
 * (i.e., you can randomly choose what a choice does on every call)
 */
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
	 * - another stage
	 * - a function that returns a string or a stage
	 *
	 *   Use this for any game state changes, like adding items to an inventory.
	 *   If returning string, it will be displayed (can use HTML) with a single
	 *   choice "ok" to return back to the same stage.
	 *
	 * `null` will hide the choice. This can be used to specify the order of the
	 * choices in the object but programmatically show/hide them later in the
	 * function.
	 */
	choices: {
		[choiceLabel: string]: Stage | (() => string | Stage) | null
	}
}

function BEGINNING() {
	let description = "you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south. ";
	if (inventory.length === 0) {
		description += "you have no memory , no items in hand. ";
	}
	let choices = {
		"go north": northPath,
		"go south": southPath,
		"go east": null as any,
		'inspect fountain': rubberRoom1,
	};
	if (inventory.includes(mapItem)) {
		choices["go east"] = () => {
			return "the map says theres nothing to the east. <a href=\"https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/escape/GAMER.ts\">for now...</a>"
		}
	}
	return {
		location: inventory.includes(mapItem) ?"Ravensmith Court": "courtyard",
		description,
		choices,
	};
}

const grassItem = "blade of grass\nIt's just a blade of grass.";
let talkedToRaven = false
let ravenCompassTaken = false
const mapItem = "Ravensmith Estate map\na somewhat blurry photocopy of a map of Ravensmith's estate. scribbles and notes dot the map, but few are legible."
const compassItem = "compass\ninvented by the chinese in 206 BCE."
function northPath() {
	let description = "the path trails off, leaving you standing on a field of uncut grass. ";
	let choices = {
		"continue north": null as any,
		"go south": BEGINNING,
	};
	if (inventory.includes(mapItem)) {
		description += "empowered by the map, you feel ready to venture into the fog. "
		choices[
			"continue north"] = fieldMan
	} else {
		choices[
			"continue north"] = () => {
				return "you do not wish to stray from the path. in the fog, it is easy to get lost."
			}
	}
	if (!talkedToRaven) {
	description += "a raven dressed in a long, dark trenchcoat shivers in the cold. "
		choices["talk to raven"] = () => {
			talkedToRaven = true
			inventory.push(mapItem)
			return "the raven's name is Ravensmith. he apparently owns this property. since you're trespassing, he gives you a map for more accurate trespassery. +1 map"
		}
	} else {
		description += "Ravensmith, dressed in a long, dark trenchcoat, shivers in the cold. "
		if (!ravenCompassTaken) {
			description += "a small, round object protrudes from his pocket. a compass, perhaps? "
		}
		if (!inventory.includes(sushiItem)||ravenCompassTaken) {
				choices["talk to Ravensmith"] = () => {
					return "Ravensmith does not bother with small talk. he humphs at you and turns his head away. "
				}
			} else {
				choices["talk to Ravensmith"] = () => {
					inventory.push(compassItem)
					inventory.splice(inventory.indexOf(sushiItem), 1);
					ravenCompassTaken = true;
					return "you ask for his compass, offering a piece of sushi. he obliges. +1 compass "
				}
			}
	}
	if (Math.random() < 0.5) {
		choices["pick grass"] = () => {
			inventory.push(grassItem)
			return "you pluck a blade of grass from the ground. +1 blade of grass.";
		}
	} else {
		
		choices["pick grass"] =() => {
				let myDiv = document.getElementById("text-based-adventure")!;
				myDiv.className = "GO_AWAY";
				myDiv = document.getElementById("rpg-battle")!;
				myDiv.className = "no-come-back-i-am-sorry";
		};
	}  
	return {
		location: inventory.includes(mapItem)?"Unnamed Field on Ravensmith Estate":"field",
		description,
		choices,
	};
}

const fishItem = "fish\na frozen fish wrapped in plastic on a styrofoam plate. its label says it's from winco.";
const spermPosterItem = "sperm donor poster\nit says \"become a sperm donor!\" theres a nice man smiling and pointing at top 3 reasons to start donating.";
let spermDonorPoster = true;
let wincoFish = true;
function southPath() {
	let description = "the path abruptly ends at a brick wall. you jump to look over, but all you see is fog. ";
	let choices = {
		"go north": BEGINNING,
	};
	if (wincoFish) {
		description += "there is a frozen fish wrapped in plastic at the base of the wall. the packaging says it's from winco. ";
		choices["take fish"] = () => {
			inventory.push(fishItem);
			wincoFish = false;
			return "you put the fish in your pocket. +1 fish.";
		}
	}
	if (spermDonorPoster) {
		description += "there is a sperm donor poster on the wall. a handsome man smiles at you and beckons for your sperm. ";
		choices["take sperm donor poster"] = () => {
			inventory.push(spermPosterItem)
			spermDonorPoster = false
			return "you carefully rip off the poster, revealing a hole just large enough for you to crawl through. +1 poster.";
		}
	} else {
		description += "theres a sizeable hole on the wall where the poster once was. ";
		choices["enter hole"] = () => {
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
	return {
		location: inventory.includes(mapItem) ? "Ravensmith Estate Wall": "brick wall",
		description,
		choices,
	};
}

const sushiItem = `sushi piece\na slice of sushi. the man who made it seemed to be a professional sushi guy or whatever the word is. raw tuna wrapped in seaweed wrapped in sticky rice. did you know? Ravensmith is a big fan of sushi.`;
let manHungry = true;
function fieldMan() {
	let description = "you trudge on blindly into the endless grassland. suddenly, you spot a man, huddled in tattered clothes lying on the ground. ";
	let choices = {
		"return south": northPath,
	};
	if (inventory.includes(fishItem) && manHungry) {
		description += 'he sees the fish sticking out of your back pocket and shakily holds a finger up to it. he offers to turn it into sushi. ';
		choices["give fish to man"] = () => {
			// manState = 'full'
			inventory.splice(inventory.indexOf(fishItem), 1);
			for (let i = 4;i--;) inventory.push(sushiItem);
			manHungry = false;
			return "bro snatches your fish, tears off the plastic with his teeth, and in a show beyond your comprehension, you find yourself being served a plate of sushi. he has cut the roll into eight slices and graciously tipped himself half of them, which he voraciously stuffs into his mouth. he burps, yawns, and falls asleep. +4 sushi pieces. ";
		};
	} else if (manHungry) {
		description += "the man stares as you, and you stare back. his stomach grumbles. ";
	} else {
		description += "he is soundly asleep, snoring a cacophony. ";
	}
	return {
		location:inventory.includes(mapItem)?"Private Property - DO NOT TRESPASS!":  "field",
		description,
		choices,
	};
}

function rubberRoom1() {
	if (rubberloops>MAX_LOOPS_RUBBER) {
	return {
		location: inventory.includes(mapItem) ?"Ravensmith Court":'courtyard',
		description: 'you slip and fall into the fountain, again. grasping for breath, you frantically try to paddle out, only to realize the water is only up to your knees.',
		choices: {'climb out': BEGINNING}
	};
	} else {
	return {
		location: inventory.includes(mapItem) ?"Ravensmith Court":'courtyard',
		description: 'you slip and fall into the fountain. grasping for breath, you frantically try to paddle out, but feel yourself sinking further into the murky water.',
		choices: {'fall': rubberRoom2}
	};
	}
}

// content warning: bad formatting

// dont say i warned you!!

// 🤢🤢🤢🤢🤮🤮🤮🤮🤮🤮

function rubberRoom2():                                                                             any{
   return                                                                                           {
      location: '???'                                                                               ,
      description:
         'your vision begins to fade as your lungs give way, water gushing into your body.'         ,
      choices: {'fall': rubberRoom3}                                                                };}

function rubberRoom3()
{ return { location: '???'
         , description: 'you wake up.'
         , choices: {'where am i?': rubberRoom}
         }
}
const MAX_LOOPS_RUBBER = 9
let rubberloops = 0
function rubberRoom() {
	return {
		location: 'rubber room',
		description: '..a rubber room with rats. and rats make you crazy.',
		choices: {'crazy?':rubberloops>MAX_LOOPS_RUBBER?rubberRoomExit1: () => {
			rubberloops += 1
			return 'i was crazy once. they locked me in a room.'
		}}
	};
}
function rubberRoomExit1() {
	return {
		location: 'rubber room',
		description: 'i was crazy once. they locked me in a room.',
		choices: {'a rubber room?': rubberRoomExit2}
	};
}
function rubberRoomExit2() {
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
function labyrinthEntrance() {
	let description = `you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south...\n\nwait, were those paths there before?\n`;
	if (inventory.length === 0) {
		description += "you have no memory , no items in hand. ";
	}
	let choices = {
		"go north": ()=>_exp(Dir.N),
		"go south": ()=>_exp(Dir.S),
		"go east": ()=>_exp(Dir.E),
		"go west": ()=>_exp(Dir.W)
	};
	return {
		location: "courtyard",
		description,
		choices,
	};
}
function labyrinthDir(dir: Dire) {
	let description = clean(`you ${t("walk")} ${dir}. 
		${rd("the walls of the courtyard seem to have grown taller...", 1, labyrinthState.length == 1)}
		${rd("is it just you, or is the architecture becoming more... brutalist?", 1, labyrinthState.length == 2)}
		${rd("thick vines creep up the walls. seems like you are thoroughly lost...", 1, labyrinthState.length == 3)}
		${rd("you feel like you've been this way before..." + rd("or have you?", 0.5), 0.3, labyrinthState.length == l_diff)} ${
		rd(`you see a ${t("material")} statue of a ${t("animal")} ${t("location")}`, 0.2, labyrinthState.length == l_diff)
		}`);
	let choices = shuffleObject({
		"go north": _exp(Dir.N),
		"go south": _exp(Dir.S),
		"go east": _exp(Dir.E),
		"go west": _exp(Dir.W)
	});
	return {
		location: "courtyard?",
		description,
		choices,
	};
}
const _exp = (d) => {pl(d);return labyrinthDir.apply({}, d)}

function shuffleObject(obj: any) {
	let entries = Object.entries(obj);
	for (let round = 0; round < 3; round++) {
		for (let i = entries.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[entries[i], entries[j]] = [entries[j], entries[i]];
		}
	}
	return Object.fromEntries(entries);
}
	

const words = {
	"walk": [
		"hobble", "stumble", "scramble", "slink", "tiptoe", "walk"
	],
	"animal": [
		"raven", "boar", "horse", "dolphin", "carp", "gargoyle", "john cena"
	],
	"material": [
		"stone", "tarnished bronze", "marble", "rusted copper", "glass"
	],
	"location": [
		"nestled among bushes", "atop a pillar", "buried in the mud", "under there"
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