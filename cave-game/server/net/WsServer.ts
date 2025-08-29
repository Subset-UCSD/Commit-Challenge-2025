import { getRandomValues } from "crypto";
import express from "express";
import { readFile, writeFile } from "fs/promises";
import http from "http";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer } from "ws";

import { BiMap } from "../../communism/lib/BiMap";
import { ClientMessage, ServerMessage } from "../../communism/messages";
import * as not from "../../not/indice";
import { Game } from "../Game";
import { Connection, Server } from "./Server";
// import { ExpressPeerServer } from "peer";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RECONNECT_TIMEOUT = 60 * 60 * 1000;

// DO NOT REMOVE unless it's a move to maintain chat functionality
type Database = {
	chats?: string[];
};
const database: Database = JSON.parse(await readFile("./db.json", "utf-8").catch(() => "{}"));
database.chats ??= [];

/**
 * An implementation of `Server` that starts a WebSocket server.
 *
 * To keep the scope of `WsServer` small, it does not depend on `Game`. However,
 * when this server is instantiated, it is given the instance of `Game`, where
 * the handlers are defined. Does this mean that the server is the top level
 * object of our entire game? In a way, yes. However, the server has limited
 * access to the game, so the game still retains most of the control.
 */
export class WsServer implements Server<ClientMessage, ServerMessage> {
	#app = express();
	#server = http.createServer(this.#app);
	#wss = new WebSocketServer({ server: this.#server });

	/**
	 * Contrary to what the name suggests, this doesn't keep track of open
	 * WebSocket connections. Rather, it keeps track of authenticated players in
	 * the game.
	 *
	 * An entry in `#activeConnections` represents a client or user, and means:
	 *
	 * - It has a corresponding player in the game.
	 * - It has an ID.
	 *
	 * However, it doesn't guarantee that it actually has an open connection. It's
	 * possible its client has disconnected. When it reconnects, it will tell the
	 * server that it is reconnecting with its existing ID, and the entry will be
	 * updated to have the new WebSocket object.
	 *
	 * New connections also have to talk to the server before getting an entry
	 * here. They have to say that they are new, and the server will generate and
	 * give the client its ID.
	 */
	#playerConnections = new BiMap<string, WebSocket>();
	/** private -> public id */
	#publicIds = new Map<string, string>();
	#disconnectTimeouts = new Map<string, NodeJS.Timeout>();

	#game: Game;

	/**
	 * Function that hangs the server until a websocket client
	 * has connected. Once there are no clients remaining, hangs
	 * the server again.
	 *
	 * Called every time there's a new connection, but the function won't do
	 * anything if there are already connections to the server.
	 */
	#unhangServer = (_: symbol) => {};
	/**
	 * The `Symbol` is used by the main server loop to determine if the server has
	 * slept.
	 */
	hasConnection = new Promise<symbol>((resolve) => {
		this.#unhangServer = resolve;
	});

	constructor(game: Game) {
		this.#app.use(express.static(path.join(__dirname, "..", "public")));

		this.#game = game;

		this.#app.get("/", (_req, res) => {
			res.sendFile(path.join(__dirname, "../public/index.html"));
		});

		// doesnt work
		// const peerServer = ExpressPeerServer(this.#server, { path: "/VOICE" });
		// this.#app.use("/VOICE", peerServer);

		this.#wss.on("connection", this.#handleNewConnection);
	}

	#getConnection(ws: WebSocket): Connection<ServerMessage> | null {
		const id = this.#playerConnections.revGet(ws);
		if (!id) {
			return null;
		}
		/**
		 * A wrapper around the WebSocket object that stringifies the object before sending it.
		 *
		 * If we want to buffer messages before sending them all together, this is the place to do it.
		 */
		return {
			privateId: id,
			publicId: this.#publicIds.get(id) ?? "idfk",
			send(message) {
				ws.send(JSON.stringify(message));
			},
		};
	}

	#handleNewConnection = (ws: WebSocket, req: http.IncomingMessage) => {
		if (req.url?.startsWith("/not")) {
			not.handleWsConn(ws);
			return;
		}

		this.#unhangServer(Symbol());

		ws.on("message", (rawData) => {
			this.#handleMessage(ws, rawData);
		});

		ws.on("close", () => {
			const wsId = this.#playerConnections.revGet(ws);
			if (wsId) {
				//this.#game.handlePlayerDisconnect(wsId);

				this.#game.handlePlayerDisconnect(this.#publicIds.get(wsId) ?? "womp", wsId);

				// Give players a while to reconnect
				this.#disconnectTimeouts.set(
					wsId,
					setTimeout(() => {
						this.#deleteConnection(wsId);
					}, RECONNECT_TIMEOUT),
				);
			}

			if (this.#wss.clients.size === 0) {
				console.log("i eep");
				this.hasConnection = new Promise<symbol>((resolve) => {
					this.#unhangServer = resolve;
				});
				this.hasConnection.then(() => console.log("i wake"));
			}
		});
	};

	#deleteConnection(id: string) {
		this.#playerConnections.delete(id);
		this.#publicIds.delete(id);
	}

	#handleMessage(ws: WebSocket, rawData: unknown): void {
		const stringData = Array.isArray(rawData) ? rawData.join("") : String(rawData);

		let data: ClientMessage;
		try {
			data = JSON.parse(stringData);
		} catch {
			console.warn("Non-JSON message: ", stringData);
			return;
		}

		switch (data.type) {
			case "join":
				if (typeof data.id !== "string") return;

				console.log(`Player ${data.id} attempting to connect`);

				// True if this player is a reconnecting player (so they have an old ws)
				const oldWs = this.#playerConnections.get(data.id);
				let id = data.id;
				let publicId = this.#publicIds.get(id) ?? "idfk";
				if (oldWs) {
					// They already sent `join` before. what a bad boy😈. lets do nothing about it
					if (oldWs === ws) return;

					// Reconnecting while the old connection is still live should kill the old connection
					// closing a closed ws is a no-op
					oldWs.close();
				} else {
					// New player (or they reconnected with an invalid ID; we treat them like a new player)
					// Generate a new ID
					id = [...getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");
					publicId = [...getRandomValues(new Uint8Array(64))].map((x) => x.toString(16)).join("");
					this.#publicIds.set(id, publicId);
				}

				// Create mapping from the new ID to the WebSocket that is currently alive that belongs to that ID
				this.#playerConnections.set(id, ws);

				const connection = this.#getConnection(ws);
				if (!connection) {
					throw new ReferenceError(
						"For some reason, the new WebSocket connection was not successfully registered into playerConnections",
					);
				}

				// Tell the game that they joined
				this.#game.handlePlayerJoin(connection, data.name);

				console.log(`Player ${id} "${data.name}" joined!`);

				// Ok we believe u 🥰 you are the client you say you are
				connection.send({
					type: "join-response",
					privateId: id,
					publicId,
				});

				// DO NOT REMOVE unless it's a move to maintain chat functionality
				connection.send({ type: "chats", contents: database.chats ?? [] });

				// Don't remove id from list because player reconnected
				// (does nothing if player is new)
				clearTimeout(this.#disconnectTimeouts.get(data.id));
				return;

			// DO NOT REMOVE unless it's a move to maintain chat functionality
			case "chat": {
				const id = this.#playerConnections.revGet(ws) ?? "";
				for (const [, cxn] of this.#playerConnections.entries()) {
					cxn.send(JSON.stringify({ type: "chat", user: id, content: data.message }));
				}
				database.chats?.push(`[${id.slice(0, 6)}] ${data.message}`);
				writeFile("./db.json", JSON.stringify(database));
				return;
			}
		}

		const connection = this.#getConnection(ws);

		// If the client hasn't been assigned an id, they are rude. do not respond 🧐
		if (!connection) return;

		this.#game.handleMessage(data, connection);
	}
	broadcast(message: ServerMessage): void {
		for (const ws of this.#wss.clients) {
			ws.send(JSON.stringify(message));
		}
	}

	_debugGetConnectionCount(): number {
		return this.#wss.clients.size;
	}
	_debugGetPlayerCount(): number {
		return this.#playerConnections.size;
	}
	_debugGetActivePlayerCount(): number {
		return Array.from(this.#playerConnections.entries()).filter(([, ws]) => ws.readyState === WebSocket.OPEN).length;
	}

	listen(port: number): void {
		this.#server.listen(port);
		console.log(`Listening on http://localhost:${port}/`);
	}
}
