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

let ticks = 0;
let totalDelta = 0;
let lastEndTime: number | null = null;

//what actually runs the game loop
while (true) {
	// if no one is online, pause the game until someone joins
	await game.hasPlayers;

	//check time at beginning of gamestep
	let startTimeCheck = performance.now();

	// update game state
	game.updateGameState();

	// send updated state to all clients
	game.broadcastState();
	// wait until end of tick
	// broadcast(wss, )

	//check time at end of gamestep
	let endTimeCheck = performance.now();

	const timeSinceLastTickEnd = lastEndTime === null ? null : endTimeCheck - lastEndTime;
	lastEndTime = endTimeCheck;

	let delta = endTimeCheck - startTimeCheck;
	ticks++;
	totalDelta += delta;
	if (ticks >= 2000) {
		ticks = 0;
		totalDelta = 0;
	}
	//wait until the rest of the tick is complete
	if (delta > SERVER_GAME_TICK) {
		console.warn(`[main loop] Server Overloaded: extremely long tick, took ${delta.toFixed(3)} ms`);
		//shit we had a longass tick. Cry ig
	} else {
		console.log(
			`[main loop] Tick took ${delta.toFixed(3)} ms. Sleeping for ${(SERVER_GAME_TICK - delta).toFixed(3)} ms. It has been ${timeSinceLastTickEnd?.toFixed(3) ?? "N/A"} ms since last tick (should be ${SERVER_GAME_TICK} ms).`,
		);
		await delay(SERVER_GAME_TICK - delta);
	}
}
