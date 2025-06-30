/**
 * This is the top-level file that runs the entire game.
 * You should not need to modify it.
 *
 * Instead if you find yourself wanting to modify this file,
 * consider modifying Game.ts instead if you're trying to
 * implement game logic
 */
import { SERVER_GAME_TICK } from "../communism/constants";
import { delay } from "../communism/lib/delay";
import { Game } from "./Game";

const game = new Game();

let ticksEvaluated = 0;
let simulationEpoch = performance.now();
let lastEndTime: number | null = null;
let prevHasPlayerResult: symbol | null = null;

//what actually runs the game loop
while (true) {
	// if no one is online, pause the game until someone joins
	const hasPlayerResult = await game.hasPlayers;
	if (prevHasPlayerResult !== hasPlayerResult) {
		prevHasPlayerResult = hasPlayerResult;
		// A lot of time might have passed, so reset the timing code
		ticksEvaluated = 0;
		simulationEpoch = performance.now();
	}

	// check time at beginning of gamestep
	let startTimeCheck = performance.now();

	// update game state
	game.updateGameState();
	
	// send updated state to all clients
	game.broadcastState();

	ticksEvaluated++;

	// check time at end of gamestep
	const endTimeCheck = performance.now();
	const tickEvalTime = endTimeCheck - startTimeCheck;

	const timeSinceLastTickEnd = lastEndTime === null ? null : endTimeCheck - lastEndTime;
	lastEndTime = endTimeCheck;

	//wait until the rest of the tick is complete
	if (tickEvalTime > SERVER_GAME_TICK) {
		console.warn(`[main loop] Server Overloaded: extremely long tick, took ${tickEvalTime.toFixed(3)} ms`);
		//shit we had a longass tick. Cry ig
	} else {
		console.log(
			`[main loop] Tick took ${tickEvalTime.toFixed(3)} ms. It has been ${timeSinceLastTickEnd?.toFixed(3) ?? "N/A"} ms since last tick (should be ${SERVER_GAME_TICK} ms).`,
		);
		await delay(SERVER_GAME_TICK - tickEvalTime);
	}
}
