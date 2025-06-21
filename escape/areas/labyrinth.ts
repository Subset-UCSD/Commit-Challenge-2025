import type { StageInfo } from "../util/types";
import { randomWord, renderItem } from "../util/text";
import { rd, clean, shuffleObject } from "../util/text";
import inventory, { Inventory } from "../util/Inventory";
import { state } from "../util/persistent-state";

const Dir = {
	N: "north",
	E: "east",
	S: "south",
	W: "west"
} as const satisfies Record<string, string>;
type Dire = (typeof Dir)[keyof typeof Dir];

const dictionary = {
	"walk": [
		"stumble", "walk", "make your way"
	],
	"animal": [
		"raven", "boar", "horse", "dolphin", "carp", "gargoyle"
	],
	"material": [
		"stone", "tarnished bronze", "marble", "rusted copper", "glass"
	],
	"location": [
		"nestled among the vines", "atop a pillar", "buried in the mud", "sunken in a small puddle"
	]
} as const;
const t = (k: keyof typeof dictionary) => randomWord(dictionary, k);

export const labyrinthState = state<Dire[]>([]);
let l_diff = 8;
const _exp = (d: Dire)=>()=>{pl(d); return labyrinthDir };
export const labyrinthSol = state(Array(l_diff).fill(0).map(_ => Object.values(Dir)[Math.floor(Math.random() * Object.values(Dir).length)]));
const labyrinthChoices = {
	"go north": _exp(Dir.N),
	"go south": _exp(Dir.S),
	"go east": _exp(Dir.E),
	"go west": _exp(Dir.W)
};
let currentChoices = {...labyrinthChoices};
export function labyrinthEntrance(): StageInfo {
	let I: StageInfo = {
		location: "courtyard",
		description: `you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south... but also east and west\n\n`,
		choices: labyrinthChoices,
	};
	return I;
}
export function labyrinthDir(): StageInfo {
	let vines = labyrinthState.v.length == 3;
	let I: StageInfo = {
		location: labyrinthState.v.length < 4 ? "courtyard?" : "labyrinth",
		description: clean(`you ${t("walk")} ${labyrinthState.v.at(-1)}. 
			${rd("the walls of the courtyard seem to have grown taller... or maybe you're growing shorter? you look at your reflection in a puddle but don't notice anything different... nothing to be concerned about", 1, labyrinthState.v.length == 1)}
			${rd(`looking up from an intense observation session of your ${renderItem(inventory.toJSON().at(0)??{name:"empty inventory",lore:"how do you have nothing in here?"})}, you realize the architecture becoming more brutalist`, 1, labyrinthState.v.length == 2)}
			${rd("you approach one of the walls and notice thick vines creeping up its side. perhaps you could climb them to get a better view? seems like you are thoroughly lost. what direction did you come from?", 1, vines)}
			${""}
		${rd("you feel like you've been this way before..." + rd("or have you?", 0.5), 0.3, labyrinthState.v.length == l_diff)} ${rd(`you see a ${t("material")} statue of a ${t("animal")} ${t("location")}`, 0.2, labyrinthState.v.length == l_diff)
			}`),
		theme: "labyrinth",
		choices: {
			...currentChoices,
			...(vines ? {"climb vines": () => `you wrap your arms around one of the vines and begin your climb. as you get a few feet up, you notice a slick film covering the leaves -- just as realization hits, your grip slips and you plummet straight into a mud puddle. \n\nlooks like the vines won't be saving you anytime soon.`}:{})
		}
	};
	return I;
}

function pl(d: Dire) {
	currentChoices = shuffleObject(labyrinthChoices);
	if (labyrinthState.v.length >= l_diff) {
		labyrinthState.v.shift();
	}
	labyrinthState.v.push(d);
}
