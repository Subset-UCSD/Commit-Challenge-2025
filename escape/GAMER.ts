let inventory: any[] = [];

function BEGINNING() {
	let description = "you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south. ";
	if (inventory.length === 0) {
		description += "you have no memory , no items in hand. ";
	}
	let choices = {
		"go north": northPath,
		"go south": southPath,
		'inspect fountain': rubberRoom1,
	};
	return {
		location: "courtyard",
		description,
		choices,
	};
}

const grassItem = "blade of grass\nIt's just a blade of grass.";
function northPath() {
	let description = "the path trails off, leaving you standing on a field of uncut grass. ";
	if (Math.random() < 0.5) {
		let choices = {
			"continue north": fieldMan,
			"go south": BEGINNING,
			"pick grass": () => {
				inventory.push(grassItem)
				return "you pluck a blade of grass from the ground. +1 blade of grass.";
			}
		};
		return {
			location: "field",
			description,
			choices,
		};
	} else {
		let choices = {
			"continue north": fieldMan,
			"go south": BEGINNING,
			"pick grass": () => {
				let myDiv = document.getElementById("text-based-adventure")!;
				myDiv.className = "GO_AWAY";
				myDiv = document.getElementById("rpg-battle")!;
				myDiv.className = "no-come-back-i-am-sorry";
			}
		};
		return {
			location: "field",
			description,
			choices,
		};
	}  
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
		// TODO: expand the game here!
		choices["enter hole"] = () => {
			return "the hole reveals a dead end. maybe there will be something on the other side in the future?";
		};
	}
	return {
		location: "brick wall",
		description,
		choices,
	};
}

const sushiItem = `sushi piece\na slice of sushi. the man who made it seemed to be a professional sushi guy or whatever the word is. raw tuna wrapped in seaweed wrapped in sticky rice.`;
let manHungry = true;
function fieldMan() {
	let description = "you trudge on blindly into the endless grassland. suddenly, you spot a man, huddled in tattered clothes lying the ground. ";
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
		location: "field",
		description,
		choices,
	};
}

function rubberRoom1() {
	return {
		location: 'courtyard',
		description: 'you slip and fall into the fountain. grasping for breath, you frantically try to paddle out, but feel yourself sinking further into the murky water.',
		choices: {'fall': rubberRoom2}
	};
}
function rubberRoom2() {
	return {
		location: '???',
		description: 'your vision begins to fade as your lungs give way, water gushing into your body.',
		choices: {'fall': rubberRoom3}
	};
}
function rubberRoom3() {
	return {
		location: '???',
		description: 'you wake up.',
		choices: {'where am i?': rubberRoom}
	};
}
function rubberRoom() {
	return {
		location: 'rubber room',
		description: '..a rubber room with rats. and rats make you crazy.',
		choices: {'crazy?': () => {
			return 'i was crazy once. they locked me in a room.'
		}}
	};
}


function pl(d: Dir) {
	if (labyrinthState.length >= l_diff) {
		labyrinthState.shift();
	}
	labyrinthState.push(d);
}

enum Dir {
	N = "north",
	E = "east",
	S = "south",
	W = "west"
};

let labyrinthState: Dir[] = [];
let l_diff = 4;
let labyrinthSol = Array(l_diff).fill(0).map(_=>Object.values(Dir)[Math.floor(Math.random()*l_diff)]);
function labyrinthEntrance() {
	let description = `you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south...\n\nwait, were those paths there before?\n`;
	if (inventory.length === 0) {
		description += "you have no memory , no items in hand. ";
	}
	let choices = {
		"go north": labyrinthDir.bind(Dir.N),
		"go south": labyrinthDir.bind(Dir.S),
		"go east": labyrinthDir.bind(Dir.E),
		"go west": labyrinthDir.bind(Dir.W)
	};
	return {
		location: "courtyard",
		description,
		choices,
	};
}
function labyrinthDir(dir: Dir) {
	let description = `you ${tg("walk")} ${dir}. `;
	let choices = shuffleObject({
		"go north": labyrinthDir.bind(Dir.N),
		"go south": labyrinthDir.bind(Dir.S),
		"go east": labyrinthDir.bind(Dir.E),
		"go west": labyrinthDir.bind(Dir.W)
	});
	return {
		location: "courtyard?",
		description,
		choices,
	};
}

function shuffleObject(obj: any) {
	const entries = Object.entries(obj);
	for (let i = entries.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[entries[i], entries[j]] = [entries[j], entries[i]];
	}
	return Object.fromEntries(entries);
}

const words = {
	"walk": [
		"stagger", "waver", "hobble", "shamble", "stumble", "scramble",
		"creep", "slink", "tiptoe", "blunder", "flounder", "skulk"
	]
} as const;

function tg(key: keyof typeof words) {
	return words[key][Math.floor(words[key].length*Math.random())];
}