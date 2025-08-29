/*
Incipiunt murmura vocum, chorda silentii percussa. Hic, in hoc sacrario digitali, essentia soni nascitur. Animae errantes per antra resonabunt, et nos, custodes silentii, verba eorum in aethera geremus.

Hoc est sanctuarium vocis, arcanum et profundum. Qui huc intrat, mundum silentii relinquit et in regnum sonorum intrat.
*/

import Peer, { MediaConnection } from "peerjs";

import { Voice } from "../../communism/messages";
import { Vector3, YXZEuler } from "../../communism/types";
import { send } from "../";

type PeerData = { conn: MediaConnection; audio: HTMLAudioElement };

class Vox {
	static #singleton: Vox;
	#peerJsObject: Peer | null = null;
	#mediastream: MediaStream | null = null;
	#connections: Map<string, PeerData> = new Map();
	#myId: string = "";
	#entityToConnectionmap: Map<string, string> = new Map(); // entityId -> connId

	private constructor() {}

	static get singleyton(): Vox {
		if (!Vox.#singleton) Vox.#singleton = new Vox();
		return Vox.#singleton;
	}

	get myId() {
		return this.#myId;
	}

	get isACtive() {
		// active
		return !!this.#peerJsObject;
	}

	addPlayer(eId: string, cId: string) {
		// add player
		this.#entityToConnectionmap.set(eId, cId);
	}

	removePlayer(cId: string) {
		// remove player
		for (const [eId, connId] of this.#entityToConnectionmap.entries()) {
			if (connId === cId) {
				this.#entityToConnectionmap.delete(eId);
				break;
			}
		}
	}

	async join(myConnId: string) {
		// join
		if (this.#peerJsObject) return;
		try {
			this.#mediastream = await navigator.mediaDevices.getUserMedia({ audio: true });
			this.#myId = myConnId;
			this.#peerJsObject = new Peer(myConnId, {
				// For testing on localhost
				// host: 'localhost',
				// port: 9000,
				// host: location.hostname,port:location.port?+location.port:undefined,
				// path: '/VOICE/VOICE'
			});

			this.#peerJsObject.on("open", (id) => {
				send({ type: "voice-chat", payload: { type: "join-voice" } });
				this.#peerJsObject?.on("call", (call) => {
					call.answer(this.#mediastream!);
					this.#handleConnection(call);
				});
			});
		} catch (e) {
			console.error("Vox error:", e);
		}
	}

	leave() {
		// leave
		send({ type: "voice-chat", payload: { type: "leave-voice" } });
		for (const [_, data] of this.#connections) {
			data.conn.close();
			data.audio.remove();
		}
		this.#connections.clear();
		this.#peerJsObject?.destroy();
		this.#peerJsObject = null;
		this.#mediastream?.getTracks().forEach((t) => t.stop());
		this.#mediastream = null;
	}

	#handleConnection(conn: MediaConnection) {
		// handle connection
		conn.on("stream", (rs) => {
			// remote stream
			const audio = document.createElement("audio");
			audio.srcObject = rs;
			audio.play();
			document.body.appendChild(audio);
			this.#connections.set(conn.peer, { conn, audio });
		});
		conn.on("close", () => {
			const data = this.#connections.get(conn.peer);
			if (data) {
				data.audio.remove();
				this.#connections.delete(conn.peer);
			}
		});
		conn.on("error", (e) => {
			console.error("PeerJS connection error:", e);
			const data = this.#connections.get(conn.peer);
			if (data) {
				data.audio.remove();
				this.#connections.delete(conn.peer);
			}
		});
	}

	/** called when voice positions of all players are sent from server */
	updateVoicePositions(voices: Voice[], voiceInterpolationDuration: number) {
		// update
		if (!this.#peerJsObject || !this.#mediastream) return;

		const myConnId = this.#myId;

		// TODO: disregard existing impelemntation, please implement

		const MAX_DIST = 20;
		const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

		const currentPeers = new Set<string>();

		const myPos = voices.find((voice) => this.#entityToConnectionmap.get(voice.playerEntityId) === myConnId)?.position;
		if (myPos) {
			for (const { playerEntityId, position } of voices) {
				const connId = this.#entityToConnectionmap.get(playerEntityId);
				if (!connId || connId === myConnId) continue;

				const distSq = vec3.sqrDist(myPos, position);

				if (distSq < MAX_DIST_SQ) {
					currentPeers.add(connId);
					if (!this.#connections.has(connId)) {
						const call = this.#peerJsObject.call(connId, this.#mediastream);
						if (call) {
							this.#handleConnection(call);
						}
					}
					const data = this.#connections.get(connId);
					if (data) {
						const dist = Math.sqrt(distSq);
						const vol = Math.max(0, 1 - dist / MAX_DIST);
						data.audio.volume = vol * vol;
					}
				}
			}
		}

		for (const id of this.#connections.keys()) {
			if (!currentPeers.has(id)) {
				const data = this.#connections.get(id);
				if (data) {
					data.conn.close();
					data.audio.remove();
					this.#connections.delete(id);
				}
			}
		}
	}

	/** called whenever the player moves their camera */
	updateCameraAngle(angle: YXZEuler): void {
		// TODO
	}
}

// Utility for vector math
const vec3 = {
	sqrDist: (a: Vector3, b: Vector3) => {
		const dx = a[0] - b[0];
		const dy = a[1] - b[1];
		const dz = a[2] - b[2];
		return dx * dx + dy * dy + dz * dz;
	},
};

export default Vox.singleyton;
