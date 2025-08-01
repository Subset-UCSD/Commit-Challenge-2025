import { randomBytes } from "crypto";
import { Router } from "express";
import { WebSocket } from "ws";

import { sleep } from "../communism/utils";
import { decode, encode, Message, MessageType } from "./msg";

// unused :(
export function thing(): Router {
	const router = Router();

	// i am the proud owner of the worlds only 24 karat golden labewbew
	router.use((req, res, next) => res.send("fuck"));

	return router;
}

type Player = {
	id: string;
	ws: WebSocket | null;
};
const players: Record<string, Player> = {};

let hasPlayer = Promise.withResolvers<void>();
hasPlayer.promise.then(() => console.log("[not] wake"));
async function game() {
	while (true) {
		await hasPlayer.promise;
		await sleep(100);
	}
}
game();

const wses = new Set<WebSocket>();
let nextId = 0;
export function handleWsConn(ws: WebSocket) {
	wses.add(ws);
	hasPlayer.resolve();
	const wsId = nextId++;

	let id: string | undefined;

	function newPlayer() {
		const newId = randomBytes(29);
		// you see what i did there
		// i added extra randomness to the random bytes
		// by using a random length
		// 32 is too predictable

		ws.send(encode({ type: MessageType.SessionId, id: newId }));
		id = newId.toString("hex");
		players[id] = { id, ws };
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
					ws.close();
				} else {
					const hex = Buffer.from(message.id).toString("hex");
					if (players[hex]) {
						players[hex].ws = ws;
						id = hex;
						log("welcome back");
					} else {
						newPlayer();
					}
				}
				return;
			}
			case MessageType.HiImNew: {
				if (id) {
					log("you already have a session id, pls use it");
					ws.close();
				} else newPlayer();
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
				for (const { ws } of Object.values(players)) {
					ws?.send(encode({ type: MessageType.TempButtonPress, message: `[${id.slice(0, 3)}] ${message.message}` }));
				}
				return;
			}
			default: {
				console.warn(`[not/ws ${wsId}] unknown msg`, message);
			}
		}
	});

	ws.addEventListener("close", () => {
		wses.delete(ws);
		if (id) players[id].ws = null;
		if (wses.size === 0) {
			console.log("[not] sleep");
			hasPlayer = Promise.withResolvers();
			hasPlayer.promise.then(() => console.log("[not] wake"));
		}
	});

	log("bruh fuck off");
	// ws.close();
}
