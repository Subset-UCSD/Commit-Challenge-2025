import type { WebSocket } from "ws";
import { ServerMessage, ServerModelObject } from "../communism/messages";

export class Player {
	id: number;
	#ws: WebSocket;
	keyState: Array<String>;
	location: { [key: string]: any };

	constructor(id: number, ws: WebSocket) {
		this.id = id;
		this.#ws = ws;
		this.keyState = [];
		this.location = { x: 0, y: 0, z: 0 };
		//this.direction = {"t1": } //TODO PLEASE ADD DIRECTION LOGIC TO MOVEMENT
	}

	send(message: ServerMessage) {
		this.#ws.send(JSON.stringify(message));
	}

	updateKeyState(keys: Array<String>) {
		this.keyState = keys;
	}

	move() {
		this.keyState.forEach((key) => {
			if ("KeyW" == key) {
				this.location["x"] += 1; //THIS REQUIRES DIRECTION TO KNOW WHERE TO POINT
			}
		});
		console.log(this.location);
		new ServerModelObject();
		return this.location;
	}
}
