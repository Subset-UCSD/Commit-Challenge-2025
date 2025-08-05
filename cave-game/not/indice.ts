import { randomBytes } from "crypto";
import { Router } from "express";
import matter from "matter-js";
import { WebSocket } from "ws";
const { Bodies, Composite, Engine, Runner } = matter;

import { FUCK_OFF } from "../client/net";
import { sleep } from "../communism/utils";
import { TICK_DUR } from "./cum";
import { decode, encode, Message, MessageType, SceneObject, WireframeData } from "./msg";

// unused :(
export function thing(): Router {
	const router = Router();

	// i am the proud owner of the worlds only 24 karat golden labewbew
	router.use((req, res, next) => res.send("fuck"));
	// bruh its only been a few days and now she posts a blackface labubub video

	return router;
}

type ServerSceneObj = { id: number; x: number; y: number; angle: number };

type Player = {
	id: string;
	send:
		| (((msg: Message) => void) & {
				ws: WebSocket;
				lastSent?: ServerSceneObj[];
		  })
		| null;
	wantsWireframes: boolean;
};
const players: Record<string, Player> = {};

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
	const engine = Engine.create({
		// premature optimization
		enableSleeping: true,
	});

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

		const scene = Composite.allBodies(engine.world).map(
			(body, i): ServerSceneObj => ({ id: i, ...body.position, angle: body.angle }),
		);
		const inScene = new Set(scene.map((obj) => obj.id));
		for (const { send } of playerList) {
			if (send) {
				if (send.lastSent) {
					const removed: number[] = [];
					for (const { id } of send.lastSent) {
						if (!inScene.has(id)) {
							removed.push(id);
						}
					}
					const map = Object.fromEntries(send.lastSent.map((obj) => [obj.id, obj]));
					const objects: SceneObject[] = [
						...removed.map((id): SceneObject => ({ id, removed: true })),
						...scene.flatMap((obj) => {
							const old = map[obj.id];
							// we could also introduce a threshold (or just send f32s or even
							// f16) so minor float changes are considered basically equal
							return old?.x === obj.x && old.y === obj.y && old.angle === obj.angle ? [] : [obj];
						}),
					];
					if (objects.length !== 0) send({ type: MessageType.Objects, objects });
					send.lastSent = scene;
				} else {
					send({ type: MessageType.Objects, resetAll: true, objects: scene });
					send.lastSent = scene;
				}
			}
		}

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
	console.log(`[not/ws ${wsId}] open`);

	let id: string | undefined;

	function newPlayer() {
		const newId = randomBytes(29);
		// you see what i did there
		// i added extra randomness to the random bytes
		// by using a random length
		// 32 is too predictable

		id = newId.toString("hex");
		players[id] = { id, send: Object.assign((msg: Message) => ws.send(encode(msg)), { ws }), wantsWireframes: false };
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
			data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
		}
		if (!(data instanceof ArrayBuffer)) {
			console.warn(`[not/ws ${wsId}] received non array buffer message`, data);
			return;
		}
		let message: Message;
		try {
			// TODO: idk why i need to slice 6
			message = decode(data);
			// console.log("ignoring", data.slice(0, 6));
		} catch (err) {
			console.warn(`[not/ws ${wsId}] failed to decode msg`, err);
			return;
		}
		switch (message.type) {
			case MessageType.Log: {
				console.log(`[not/ws ${wsId} log]`, message.message);
				return;
			}
			case MessageType.SessionId: {
				const hex = Buffer.from(message.id).toString("hex");
				if (id) {
					log("(SessionId) you already have a session id, pls use it");
					ws.close(1002, FUCK_OFF);
				} else {
					if (players[hex]) {
						if (players[hex].send) {
							log("ur alr online it seems, ill kick the old connection");
							players[hex].send({ type: MessageType.Log, message: "new conn from you, bye" });
							players[hex].send.ws.close(1002, FUCK_OFF);
						}
						players[hex].send = Object.assign((msg: Message) => ws.send(encode(msg)), { ws });
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
					log("(HiImNew) you already have a session id, pls use it");
					ws.close(1002, FUCK_OFF);
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
		console.log(`[not/ws ${wsId}] close`);
		if (id && players[id].send?.ws === ws) {
			players[id].send = null;
		}
		if (Object.values(players).every((player) => !player.send)) {
			console.log("[not] sleep");
			hasPlayer = Promise.withResolvers();
			hasPlayer.promise.then(() => console.log("[not] wake"));
		}
	});

	log("bruh fuck off");
	// ws.close(1002, FUCK_OFF);
}
