/**
 * Warning, do not use the word exp*rt in this file or you will
 * invoke the great wrath of Thomas Powell
 * this is no longer true i hope
 * yeah actually this is bad advice
 * 
 * very important: you need to export the following:
 * - stages
 * - state
 */

import inventory from "./util/Inventory";
import type { Item, StageInfo } from "./util/types";
import { labyrinthEntrance } from "./areas/labyrinth";
export * from "./areas/labyrinth";
import { mapItem, sushiItem, compassItem, fishItem, spermPosterItem, grassItem, godWrathItem } from "./items/index";
import { removeInput, startBattle, type BattleOptions } from "./renderer";
import {addQuest, hasQuest, resolveQuest} from './util/QuestManagerFactoryBuilderCreatorFactoryFactoryObserverConflictMediator'
// declare function  startBattle (options: BattleOptions):void
// declare function removeInput ():void
import {state} from './util/persistent-state'

export function BEGINNING(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Ravensmith Court" : "courtyard",
		description: "you stand in a desolate courtyard shrouded in fog. a cobblestone pathway surrounds a fountain, water dribbles meekly from a fish statue into the dark water. placards remain the only sign of where benches once stood, removed probably to discourage the homeless from sleeping here. the path continues north and south. ",
		choices: {
			"go north": northPath,
			"go south": southPath,
			"go east": null,
			"inspect fountain": rubberRoom1,
			"inspect computer": () => password1(),
		}
	};
	if (inventory.size === 0) {
		I.description += "<span style='color:#DE3163'>you have no memory, no items in hand.</span> ";
	}
	if (inventory.has(mapItem)) {
		I.choices["go east"] = () => {
			return "the map says theres nothing to the east. <a href=\"https://github.com/Subset-UCSD/Commit-Challenge-2025/blob/main/escape/GAMER.ts\">for now...</a>";
		};
	}
	return I;
}

export const talkedToRaven = state( false);
export const ravenCompassTaken = state( false);
export const grassPicked = state( 0)
export function northPath(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Unnamed Field on Ravensmith Estate" : "field",
		description: "the path trails off, leaving you standing on a field of uncut grass. ",
		choices: {
			"continue north": null,
			"go south": BEGINNING,
		},
	};
	if (inventory.has(mapItem)) {
		I.description += "<span style='color: #FFF2AF'>empowered by the map, you feel ready to venture into the fog.</span> ";
		I.choices["continue north"] = fieldMan;
	} else {
		I.choices["continue north"] = () => {
			return "you do not wish to stray from the path. in the fog, it is easy to get lost.";
		};
	}
	if (!talkedToRaven.value) {
		I.description += "<span style='color: #DAD2FF'>a raven dressed in a long, dark trenchcoat shivers in the cold.</span> ";
		I.choices["talk to raven"] = () => {
			talkedToRaven .value=(true);
			inventory.add(mapItem);
			return "the raven's name is Ravensmith. he apparently owns this property. since you're trespassing, he gives you a map for more accurate trespassery. +1 map";
		}
	} else {
		I.description += "<span style='color: #B2A5FF'>Ravensmith, dressed in a long, dark trenchcoat, shivers in the cold.</span> ";
		if (!ravenCompassTaken.value) {
			I.description += "<span style='color: #E5989B'>a small, round object protrudes from his pocket. a compass, perhaps?</span> ";
		}
		I.choices["attack Ravensmith"] = ()=>{
				return "attacking Ravensmith now will softlock you from the game. i cant let that happen. "
		}
		if (!inventory.has(sushiItem) || ravenCompassTaken.value) {
			I.choices["talk to Ravensmith"] = () => {
				return "Ravensmith does not bother with small talk. he humphs at you and turns his head away. "
			}
			
		} else {
			I.choices["talk to Ravensmith"] = () => {
				inventory.add(compassItem)
				inventory.remove(sushiItem, 1);
				ravenCompassTaken .value=(true);
				return "you ask for his compass, offering a piece of sushi. he obliges. +1 compass "
			}
			
		}
		if (ravenCompassTaken.value){
I.choices["attack Ravensmith"] =()=>{
				startBattle({ 
					attackTime:200,
					description:'dumbass.',
					attackStrength:3,
					totalEnemyHealth:1000,
					totalMeHealth:100,
					enemyImage:'./assets/rat.png',hasWeapon:true,theirattackStrength:10,theirattackTime:1000,
					myAttackSound: '../ass/ets/hit-slap.mp3',
					theirAttackSound: '../ass/ets/hit-slap.mp3',
				})
	return"wtf."
}
		}
		
	}
	if (Math.random() < 0.5 || grassPicked.value < 2) {
		I.choices["pick grass"] = () => {
			inventory.add(grassItem)
			grassPicked.value++
			return "you pluck a blade of grass from the ground. +1 blade of grass.";
		}
	} else {

		I.choices["pick grass"] = () => {
			let myDiv = document.getElementById("text-based-adventure")!;
			myDiv.className = "GO_AWAY";
			myDiv = document.getElementById("rpg-battle")!;
			myDiv.className = "no-come-back-i-am-sorry";
			return null
		};
	}
	return I;
}

export const spermDonorPoster =state( true);
export const wincoFish =state( true);
export function southPath(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Ravensmith Estate Wall" : "brick wall",
		description: "the path abruptly ends at a brick wall. you jump to look over, but all you see is fog. ",
		choices: {
			"go north": BEGINNING,
			"follow the wall": followWall,
		},
	}
	if (wincoFish.value) {
		I.description += "<span style='color: #FFB4A2'>there is a frozen fish wrapped in plastic at the base of the wall. the packaging says it's from winco.</span> ";
		I.choices["take fish"] = () => {
			inventory.add(fishItem);
			wincoFish.value= (false);
			return "you put the fish in your pocket. +1 fish.";
		}
	}
	if (spermDonorPoster.value) {
		I.description += "<span style='color: #FFCDB2'>there is a sperm donor poster on the wall. a handsome man smiles at you and beckons for your sperm.</span> ";
		I.choices["take sperm donor poster"] = () => {
			inventory.add(spermPosterItem)
			spermDonorPoster  .value=(false)
			return "you carefully rip off the poster, revealing a hole just large enough for you to crawl through. +1 poster.";
		}
	} else {
		I.description += "<span style='color: #F4F8D3'>theres a sizeable hole on the wall where the poster once was.</span> ";
		I.choices["enter hole"] = hole;
	}
	return I;
}

export function hole():StageInfo {
	return {
		location: "hole",
		description: "the hole reveals a dead end.",
		choices: {
			"Ok": () => {
				startBattle({ 
					attackTime:200,
					description:'theres also a rat. the rat is blind and deaf and paralised. but it is in the way of the exit.',
					attackStrength:3,
					totalEnemyHealth:100,
					totalMeHealth:100,
					enemyImage:'./assets/rat.png',hasWeapon:false,theirattackStrength:1,theirattackTime:Infinity,
					myAttackSound: '../ass/ets/hit-slap.mp3',
					theirAttackSound: '../ass/ets/hit-slap.mp3',
				})
				inventory.add(ratItem)
				resolveQuest(ratQuest)
				return ratDead
			},
			"enter dead end": labyrinthEntrance
		}
	}
}

const ratQuest=  "find a rat from the brick wall"
const ratBringQuest=  "give jimmy the rat"
export const beatJimmyUp = state(false)
export function followWall():StageInfo {
	const I: StageInfo  = {
		location: inventory.has(mapItem) ? "Ravensmith Estate Wall" : "brick wall",
		description: "you continue along the wall until you see a metal-plated sign bolted on the wall. ",
		choices: {
			"return to the path": southPath,
			"read sign": () => {
				if(!beatJimmyUp.value){
					addQuest(ratBringQuest)
					if (!inventory.has(ratItem)) addQuest(ratQuest)
				}
				// inventory.add(ratItem)//TEMP
				return "the sign reads, \"employee of the month: jimmy, estate wall pest control.\" upon closer inspection, there are more words scratched onto the wall: \"do NOT bring him rats\""
			}
		}
	}
	if (inventory.has(ratItem)) {
		I.choices["place rat"] = () => {
			inventory.remove(ratItem)
			resolveQuest(ratBringQuest)
			startBattle({ 
				attackTime:200,
				description:'you have summoned jimmy. he gobbles up the rat corpse but does not look pleased. uh.. he looks quite pissed, actually.',
				attackStrength:3,
				totalEnemyHealth:100,
				totalMeHealth:100,
				enemyImage:'../ass/ets/softwareengineer.png',hasWeapon:false,theirattackStrength:10,theirattackTime:2000,
				myAttackSound: '../ass/ets/hit-slap.mp3',
				theirAttackSound: '../ass/ets/hit-slap.mp3',
			})
			addQuest("escape the feds")
			beatJimmyUp .value= (true)
			return "congrats. you have assaulted a man. the feds are after you now."
		}
	}
	return I
}

const ratItem :Item= {name:'rat',lore:'dead. stinky'}
export function ratDead():StageInfo {
	return {
		location:'hole',
description:"congrats u beat up a defenseless rat. +1 rat",
choices:{'exit':southPath}
	}
}

export const manHungry = state(true);
export function fieldMan(): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Private Property - DO NOT TRESPASS!" : "field",
		description: "you trudge on blindly into the endless grassland. suddenly, you spot a man, huddled in tattered clothes lying on the ground. ",
		choices: {
			"continue north": powell,
			"return south": northPath,
		},
		theme: 'northernProperty'
	};
	if (inventory.has(fishItem) && manHungry.value) {
		I.description += 'he sees the fish sticking out of your back pocket and shakily holds a finger up to it. he offers to turn it into sushi. ';
		I.choices["give fish to man"] = () => {
			// manState = 'full'
			inventory.remove(fishItem, 1);
			for (let i = 4; i--;) inventory.add(sushiItem);
			manHungry .value= (false);
			return "bro snatches your fish, tears off the plastic with his teeth, and in a show beyond your comprehension, you find yourself being served a plate of sushi. he has cut the roll into eight slices and graciously tipped himself half of them, which he voraciously stuffs into his mouth. he burps, yawns, and falls asleep. +4 sushi pieces. ";
		};
	} else if (manHungry.value) {
		I.description += "<span style='color: #A6F1E0'>the man stares as you, and you stare back. his stomach grumbles.</span> ";
	} else {
		I.description += "<span style='color: #F7CFD8'>he is soundly asleep, snoring a cacophony.</span> ";
	}
	return I;
}

export function powell():StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Private Property - DO NOT TRESPASS!" : "field",
		description: "<img src='./assets/powel.jpg' alt='man' id='powpow'>\n\na mysterious figure appears from the fog. you try to take a step back, but find yourself only stepping forward. you freeze, too afraid to move in his presence. ",
		choices: {
		},
		theme: 'northernProperty'
	};
	return I
}
// @ts-ignore
document.addEventListener("keydown", (e: KeyboardEvent) => {
	const t: HTMLElement = <HTMLInputElement>e.target;
	if (t?.id !== "password-input") return;
	e.preventDefault();
	e.stopPropagation();
	if (e.key === "Backspace" || e.key === "Delete") {
		t.textContent = t.textContent!.slice(0,-1);
		return;
	}
	if (!e.key.match(/^[a-zA-Z0-9 ]$/)) {
		// EXTREMELY LOUD INCORRECT BUZZER
		return;
	}
	t.textContent += e.key;
});

export const passwordGuessed = state(false);
function passwordStage(description: string, password: string, nextStage: () => StageInfo): StageInfo {
	let I: StageInfo = {
		location: inventory.has(mapItem) ? "Ravensmith Court" : 'courtyard',
		description: description,
		inputs: '<div role="textbox" contenteditable autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" tabindex=0 id="password-input"></div>',
		choices: {},
	}

        I.choices['submit'] = () => {
                const inputElement = document.getElementById("password-input") as HTMLElement;
                const input = inputElement?.textContent || "";
                if (input === password) return nextStage();
                return passwordStage(description, password, nextStage);
        }

	I.choices["give up"] = () => {
		removeInput();
		return BEGINNING;
	};

	return I;
}

export function password1(): StageInfo { 
	if (!passwordGuessed.value) {
		return passwordStage("enter password", "password", password2);
	} else {
		return {
			location: inventory.has(mapItem) ? "Ravensmith Court" : 'courtyard',
			description: 'the screen is off. it occasionally makes haunting screeches that reverberate around you. you feel uncomfortable.',
			choices: { 'leave': BEGINNING }
		};
	}
}
export function password2(): StageInfo { return passwordStage("password is incorrect", "incorrect", password3);}
export function password3(): StageInfo { return passwordStage("try again", "again", password4);}
export function password4(): StageInfo { return passwordStage("try again later", "again later", passwordEnd);}

export function passwordEnd(): StageInfo {
	removeInput();

	if (!passwordGuessed.value) inventory.add(godWrathItem);
	passwordGuessed .value= (true);
	
	let I: StageInfo = {
		location: 'courtyard',
		description: "you anger the gods.",
		choices: {"leave": BEGINNING},
	}

	return I;
}

export function rubberRoom1(): StageInfo {
	if (rubberloops.value > MAX_LOOPS_RUBBER) {
		return {
			location: inventory.has(mapItem) ? "Ravensmith Court" : 'courtyard',
			description: 'you slip and fall into the fountain, again. grasping for breath, you frantically try to paddle out, only to realize the water is only up to your knees.',
			choices: { 'climb out': BEGINNING }
		};
	} else {
		return {
			location: inventory.has(mapItem) ? "Ravensmith Court" : 'courtyard',
			description: 'you slip and fall into the fountain. grasping for breath, you frantically try to paddle out, but feel yourself sinking further into the murky water.',
			choices: { 'fall': rubberRoom2 }
		, theme: 'fountainRats'
		};
	}
}

// content warning: bad formatting

// dont say i warned you!!

// 🤢🤢🤢🤢🤮🤮🤮🤮🤮🤮

export function rubberRoom2(): StageInfo {
	return {
		location: '???',
		description:
			'your vision begins to fade as your lungs give way, water gushing into your body.',
		choices: { 'fall': rubberRoom3 }
		, theme: 'fountainRats'
	};
}

export function rubberRoom3(): StageInfo {
	return {
		location: '???'
		, description: 'you wake up.'
		, choices: { 'where am i?': rubberRoom }
		, theme: 'fountainRats'
	}
}
const MAX_LOOPS_RUBBER = 9
export const rubberloops = state(0)
export function rubberRoom(): StageInfo {
	return {
		location: 'rubber room',
		description: '..a rubber room with rats. and rats make you crazy.',
		choices: {
			'crazy?': rubberloops.value > MAX_LOOPS_RUBBER ? rubberRoomExit1 : () => {
				rubberloops.value++
				return 'i was crazy once. they locked me in a room.'
			}
		},
		theme: 'fountainRats'
	};
}
export function rubberRoomExit1(): StageInfo {
	return {
		location: 'rubber room',
		description: 'i was crazy once. they locked me in a room.',
		choices: { 'a rubber room?': rubberRoomExit2 },
		theme: 'fountainRats'
	};
}
export function rubberRoomExit2(): StageInfo {
	return {
		location: 'rubber room',
		description: '..a rubber room with rats, yes. and rats...',
		choices: { 'make me crazy': BEGINNING },
		theme: 'fountainRats'
	};
}
