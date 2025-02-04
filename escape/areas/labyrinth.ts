import type { StageInfo } from "../util/types";
import { randomWord } from "../util/text";
import { rd, clean, shuffleObject } from "../util/text";
import inventory from "../util/Inventory";

const Dir = {
	N: "north",
	E: "east",
	S: "south",
	W: "west"
} as const satisfies Record<string, string>;
type Dire = (typeof Dir)[keyof typeof Dir];

const dictionary = {
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
const t = (k: keyof typeof dictionary) => randomWord(dictionary, k);

let labyrinthState: Dire[] = [];
let l_diff = 8;
const _exp = (d: Dire) => { pl(d); return labyrinthDir };
let labyrinthSol = Array(l_diff).fill(0).map(_ => Object.values(Dir)[Math.floor(Math.random() * Object.values(Dir).length)]);
let labyrinthChoices = {
	"go north": _exp(Dir.N),
	"go south": _exp(Dir.S),
	"go east": _exp(Dir.E),
	"go west": _exp(Dir.W)
};
export function labyrinthEntrance(): StageInfo {
	let I: StageInfo = {
		location: "courtyard",
		description: `you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south...\n\nwait, were those paths there before?\n`,
		choices: labyrinthChoices,
	};
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
		${rd("you feel like you've been this way before..." + rd("or have you?", 0.5), 0.3, labyrinthState.length == l_diff)} ${rd(`you see a ${t("material")} statue of a ${t("animal")} ${t("location")}`, 0.2, labyrinthState.length == l_diff)
			}`),
		choices: shuffleObject(labyrinthChoices),
	};
	return I;
}

function pl(d: Dire) {
	if (labyrinthState.length >= l_diff) {
		labyrinthState.shift();
	}
	labyrinthState.push(d);
}
