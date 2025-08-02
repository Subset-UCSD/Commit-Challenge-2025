import { randomBytes } from "crypto";
import { Router } from "express";
import matter from "matter-js";
import { WebSocket } from "ws";
const { Bodies, Composite, Engine, Runner } = matter;

import { FUCK_OFF } from "../client/net";
import { sleep } from "../communism/utils";
import { decode, encode, Message, MessageType, WireframeData } from "./msg";

// unused :(
export function thing(): Router {
	const router = Router();

	// i am the proud owner of the worlds only 24 karat golden labewbew
	router.use((req, res, next) => res.send("fuck"));

	return router;
}

type Player = {
	id: string;
	send: ((msg: Message) => void) | null;
	wantsWireframes: boolean;
};
const players: Record<string, Player> = {};

/** in ms */
const TICK_DUR = 100;
/**
 * phys delta should be at most 1000 / 60
 *
 * @link https://brm.io/matter-js/docs/classes/Runner.html#property_delta
 *
 * TICK_DUR / SIMS_PER_TICK <= 1000 / 60 = 16.6666667
 */
const SIMS_PER_TICK = 6;

// Promise.withResolvers is by far the best shit tc39 came up with in the past five yars
let hasPlayer = Promise.withResolvers<void>();
hasPlayer.promise.then(() => console.log("[not] wake, start")).then(game);
const enginee = Promise.withResolvers<matter.Engine>();
async function game() {
	const engine = Engine.create();

	const boxA = Bodies.rectangle(400, 200, 80, 80, { restitution: 0.5 });
	const boxB = Bodies.rectangle(450, 50, 80, 80, { restitution: 0.5 });
	const circ = Bodies.circle(425, 400, 80, { restitution: 0.5 });
	const ground = Bodies.rectangle(400, 610, 790, 60, { isStatic: true });
	Composite.add(engine.world, [
		boxA,
		boxB,
		circ,
		ground,
		Bodies.rectangle(40, 300, 60, 610, { isStatic: true }),
		Bodies.rectangle(840, 310, 60, 610, { isStatic: true }),
	]);

	enginee.resolve(engine);

	while (true) {
		await hasPlayer.promise;

		for (let i = 0; i < SIMS_PER_TICK; i++) {
			Engine.update(engine, TICK_DUR / SIMS_PER_TICK);
		}
		// console.log(
		// 	Composite.allBodies(engine.world).flatMap((body) => body.parts),
		// 	// .map(({ angle, position }) => ({ angle, position })),
		// );

		const playerList = Object.values(players);

		if (playerList.some((p) => p.send && p.wantsWireframes)) {
			const wireframe: WireframeData = { circles: [], vertices: [] };
			for (const body of Composite.allBodies(engine.world)) {
				for (const part of body.parts) {
					if (part.circleRadius) {
						wireframe.circles.push({ ...part.position, r: part.circleRadius });
					} else {
						wireframe.vertices.push(part.vertices.map(({ x, y }) => [x, y]));
					}
				}
			}
			for (const { send, wantsWireframes } of playerList) {
				if (send && wantsWireframes) {
					send({ type: MessageType.DebugWireframe, json: wireframe });
				}
			}
		}

		await sleep(TICK_DUR);
	}
}

let nextId = 0;
export function handleWsConn(ws: WebSocket) {
	const wsId = nextId++;

	let id: string | undefined;

	function newPlayer() {
		const newId = randomBytes(29);
		// you see what i did there
		// i added extra randomness to the random bytes
		// by using a random length
		// 32 is too predictable

		id = newId.toString("hex");
		players[id] = { id, send: (msg) => ws.send(encode(msg)), wantsWireframes: false };
		players[id].send?.({ type: MessageType.SessionId, id: newId });
		enginee.promise.then((engine) => {
			Composite.add(engine.world, [
				Bodies.rectangle(
					400 + 50 * Math.random(),
					0 + Math.random() * 200,
					Math.random() * 200 + 10,
					Math.random() * 200 + 10,
					{
						mass: 10,
						restitution: 0.8,
					},
				),
			]);
		});
	}
	function playerJoin() {
		hasPlayer.resolve();
		enginee.promise.then((engine) => {
			Composite.add(engine.world, [
				Bodies.circle(400 + 50 * Math.random(), 0 + Math.random() * 200, Math.random() * 10 + 10, {
					mass: 1,
					restitution: 0.9,
				}),
			]);
		});
	}
	function log(message: string) {
		ws.send(encode({ type: MessageType.Log, message }));
	}

	ws.addEventListener("message", ({ data }) => {
		if (data instanceof Buffer && data.buffer instanceof ArrayBuffer) {
			data = data.buffer;
		}
		if (!(data instanceof ArrayBuffer)) {
			console.warn(`[not/ws ${wsId}] received non array buffer message`, data);
			return;
		}
		let message: Message;
		try {
			// TODO: idk why i need to slice 6
			message = decode(data.slice(6));
		} catch (err) {
			console.warn(`[not/ws ${wsId}] failed to decode msg`, err);
			return;
		}
		switch (message.type) {
			case MessageType.Log: {
				console.log(`[not/ws ${wsId}]`, message.message);
				return;
			}
			case MessageType.SessionId: {
				if (id) {
					log("you already have a session id, pls use it");
					ws.close(FUCK_OFF);
				} else {
					const hex = Buffer.from(message.id).toString("hex");
					if (players[hex]) {
						if (players[hex].send) {
							// TODO: what to do here
							log("ur alr online it seems");
							ws.close(FUCK_OFF);
							return;
						}
						players[hex].send = (msg) => ws.send(encode(msg));
						id = hex;
						log("welcome back");
					} else {
						newPlayer();
					}
					playerJoin();
				}
				return;
			}
			case MessageType.HiImNew: {
				if (id) {
					log("you already have a session id, pls use it");
					ws.close(FUCK_OFF);
				} else {
					newPlayer();
					playerJoin();
					playerJoin;
				}
				return;
			}
			case MessageType.Eval: {
				log("nice try.. hacker!!");
				return;
			}
			case MessageType.TempButtonPress: {
				if (!id) {
					return;
				}
				for (const { send } of Object.values(players)) {
					send?.({ type: MessageType.TempButtonPress, message: `[${id.slice(0, 3)}] ${message.message}` });
				}
				return;
			}
			case MessageType.DebugWireframeEnable: {
				if (id) {
					players[id].wantsWireframes = message.enabled;
				} //
				return;
			}
			default: {
				console.warn(`[not/ws ${wsId}] unknown msg`, message);
			}
		}
	});

	ws.addEventListener("close", () => {
		if (id) {
			players[id].send = null;
			if (Object.values(players).every((player) => !player.send)) {
				console.log("[not] sleep");
				hasPlayer = Promise.withResolvers();
				hasPlayer.promise.then(() => console.log("[not] wake"));
			}
		}
	});

	log("bruh fuck off");
	// ws.close(FUCK_OFF);
}
