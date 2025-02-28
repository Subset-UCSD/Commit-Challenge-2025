/**
 * game state manager AND http server
 *
 * 🎉 this is the main entry point of the backend
 */

import { mat4 } from "gl-matrix";

import { randomQuaternion } from "../communism/lib/quaternion";
import { ServerMessage, ServerModelObject } from "../communism/messages";
import { Connection } from "./net/Server";
import { WsServer } from "./net/WsServer";
import { Player } from "./Player";

let nextId = 0;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export class Game {
	#currentTick: number;
	activePlayers = new Map<number, Player>();
	gameState = new Array<ServerModelObject>();

	server = new WsServer(this);

	constructor() {
		this.#currentTick = 0;
	}

	updateGameState() {}

	broadcastState() {
		for (const cxn of this.activePlayers.values()) {
			cxn.send({
				type: "entire-state",
				objects: [
					{
						id: "hey",
						model: "./marcelos/notacube_smooth.glb",
						transform: [
							...mat4.fromRotationTranslationScale(
								mat4.create(),
								randomQuaternion(),
								[0, 0, 0],
								[0.1 + 1.5 * Math.random(), 0.1 + 1.5 * Math.random(), 0.1 + 1.5 * Math.random()],
							),
						],
						interpolate: {
							duration: 1500,
						},
					},
					{
						id: "floor",
						model: "./marcelos/floor.glb",
						transform: [...mat4.fromTranslation(mat4.create(), [0, -1, 0])],
						interpolate: {
							duration: 1500,
						},
					},
				],
			});
		}
	}

	handlePlayerJoin(conn: Connection<ServerMessage>, name: string) {}

	#nextTick() {
		this.#currentTick++;

		// Tick the player inputs
		/*for (let input of this.#createdInputs) {
			input.serverTick();
		}*/
	}
}
