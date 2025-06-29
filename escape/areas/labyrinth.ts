import type { StageInfo } from "../util/types";
import { randomWord, renderItem } from "../util/text";
import { rd, clean, shuffleObject } from "../util/text";
import inventory, { Inventory } from "../util/Inventory";
import { state } from "../util/persistent-state";
import { compassItem, escapeRope, junkStatue, ravenStatue } from "../items";

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
		"stone", "tarnished bronze", "weathered marble", "rusted copper", "chipped glass"
	],
	"location": [
		"nestled among the vines", "atop a plinth in the center of a clearing", "buried in the mud", "sunken in a small puddle", "under the brush"
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
	let hasCompass = inventory.has(compassItem);
	let vines = labyrinthState.v.length == 3;
	let has_escape_rope = inventory.has(escapeRope);
	let show_escape_rope = labyrinthState.v.length == l_diff && has_escape_rope ? Math.random() > 0.9 : false;
	let show_statue = labyrinthState.v.length == l_diff ? Math.random() > 0.8 : false;
	let animal = t("animal");
	let is_raven = animal === "raven";
	const flavor = [
		"",
		"the walls of the courtyard seem to have grown taller... or maybe you're growing shorter? you look at your reflection in a puddle but don't notice anything different.\n\nnothing to be concerned about",
		`you space out and stare at your ${renderItem(inventory.toJSON().at(0)??{name:"empty inventory",lore:"how do you have nothing in here?"})}. when you look up, you notice the architecture is more brutalist`,
		"you've been walking for a while now. you're basically lost forever.\n\nyou approach one of the walls and notice thick vines creeping up its side. perhaps you could climb them to get a better view?",
	];
	let grab_animal = {} as any;
	grab_animal[`grab ${animal} statue`] = () => {inventory.add(junkStatue); return "you bent your knees, keeping your back straight and heaved the statue up and into your inventory. nice form! +1 animal statue"};
	let grab_raven = {
		"grab raven statue": () => {inventory.add(ravenStatue); return "you lug the raven statue into your inventory. your form is bad and you will have back pain in 5 years. +1 raven statue; +1 +1 back pain"}
	};
	let I: StageInfo = {
		location: labyrinthState.v.length < 4 ? "courtyard?" : "labyrinth",
		description: clean(`you ${t("walk")} ${labyrinthState.v.at(-1)}.\n
			${flavor.at(labyrinthState.v.length)??""}
			${rd("you feel like you've been this way before..." + rd(" or have you?", 0.5), 0.3, labyrinthState.v.length == l_diff)}${
				show_statue ? `you see a ${t("material")} statue of a ${t("animal")} ${t("location")}, maybe you should <b>take it</b>?` : ""
			}`),
		theme: "labyrinth",
		choices: {
			...currentChoices,
			...(vines ? {"climb vines": () => `you wrap your arms around one of the vines and begin your climb. as you get a few feet up, you notice a slick film covering the leaves -- just as realization hits, your grip slips and you plummet straight into a mud puddle. \n\nlooks like the vines won't be saving you anytime soon.`}:{}),
			...(show_escape_rope ? {"grab escape rope": () => {inventory.add(escapeRope);return "you hoist the escape rope over your shoulder. +1 rope"}}:{}),
			...(show_statue && !is_raven ? grab_animal : {})
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
