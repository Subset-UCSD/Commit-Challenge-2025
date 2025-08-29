/*
Incipiunt murmura vocum, chorda silentii percussa. Hic, in hoc sacrario digitali, essentia soni nascitur. Animae errantes per antra resonabunt, et nos, custodes silentii, verba eorum in aethera geremus.

Hoc est sanctuarium vocis, arcanum et profundum. Qui huc intrat, mundum silentii relinquit et in regnum sonorum intrat.
*/

import { mat4, vec3 } from "gl-matrix";
import Peer, { MediaConnection } from "peerjs";

import { cameraTransform } from "../../communism/cam";
import { Voice } from "../../communism/messages";
import { Vector3, YXZEuler } from "../../communism/types";
import { send } from "../";

type PeerData = {
	conn: MediaConnection;
	source: MediaStreamAudioSourceNode;
	panner: PannerNode;
};

class Vox {
	static #singleton: Vox;
	#peerJsObject: Peer | null = null;
	#mediastream: MediaStream | null = null;
	#connections: Map<string, PeerData> = new Map();
	#myId: string = "";
	#entityToConnectionmap: Map<string, string> = new Map(); // entityId -> connId
	#audioContext: AudioContext | null = null;

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
			this.#audioContext = new AudioContext();
			this.#audioContext.resume();

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
			data.source.disconnect();
			data.panner.disconnect();
		}
		this.#connections.clear();
		this.#peerJsObject?.destroy();
		this.#peerJsObject = null;
		this.#mediastream?.getTracks().forEach((t) => t.stop());
		this.#mediastream = null;
		this.#audioContext?.close();
		this.#audioContext = null;
	}

	#handleConnection(conn: MediaConnection) {
		// handle connection
		conn.on("stream", (rs) => {
			if (!this.#audioContext) {
				console.error("No audio context");
				return;
			}
			// remote stream
			const source = this.#audioContext.createMediaStreamSource(rs);
			const panner = this.#audioContext.createPanner();

			panner.panningModel = "HRTF";
			panner.distanceModel = "inverse";
			panner.refDistance = 1;
			panner.maxDistance = 10000;
			panner.rolloffFactor = 1;
			panner.coneInnerAngle = 360;
			panner.coneOuterAngle = 0;
			panner.coneOuterGain = 0;

			source.connect(panner);
			panner.connect(this.#audioContext.destination);

			this.#connections.set(conn.peer, { conn, source, panner });
		});
		conn.on("close", () => {
			const data = this.#connections.get(conn.peer);
			if (data) {
				data.source.disconnect();
				data.panner.disconnect();
				this.#connections.delete(conn.peer);
			}
		});
		conn.on("error", (e) => {
			console.error("PeerJS connection error:", e);
			const data = this.#connections.get(conn.peer);
			if (data) {
				data.source.disconnect();
				data.panner.disconnect();
				this.#connections.delete(conn.peer);
			}
		});
	}

	/** called when voice positions of all players are sent from server */
	updateVoicePositions(voices: Voice[], voiceInterpolationDuration: number) {
		// update
		if (!this.#peerJsObject || !this.#mediastream || !this.#audioContext) return;

		const myConnId = this.#myId;
		const now = this.#audioContext.currentTime;
		const interpolationTime = now + voiceInterpolationDuration / 1000;

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
						data.panner.positionX.setValueAtTime(position[0], interpolationTime);
						data.panner.positionY.setValueAtTime(position[1], interpolationTime);
						data.panner.positionZ.setValueAtTime(position[2], interpolationTime);
					}
				}
			}
		}

		for (const id of this.#connections.keys()) {
			if (!currentPeers.has(id)) {
				const data = this.#connections.get(id);
				if (data) {
					data.conn.close();
					data.source.disconnect();
					data.panner.disconnect();
					this.#connections.delete(id);
				}
			}
		}
	}

	/** called whenever the player moves their camera */
	updateCameraAngle(angle: YXZEuler, cameraPosition: Vector3): void {
		if (!this.#audioContext) return;

		const listener = this.#audioContext.listener;
		const now = this.#audioContext.currentTime;

		// Update listener position
		listener.positionX.setValueAtTime(cameraPosition[0], now);
		listener.positionY.setValueAtTime(cameraPosition[1], now);
		listener.positionZ.setValueAtTime(cameraPosition[2], now);

		// Update listener orientation
		const camMatrix = cameraTransform(null, angle);
		const forward = vec3.transformMat4(vec3.create(), [0, 0, -1], camMatrix);
		const up = vec3.transformMat4(vec3.create(), [0, 1, 0], camMatrix);

		listener.forwardX.setValueAtTime(forward[0], now);
		listener.forwardY.setValueAtTime(forward[1], now);
		listener.forwardZ.setValueAtTime(forward[2], now);
		listener.upX.setValueAtTime(up[0], now);
		listener.upY.setValueAtTime(up[1], now);
		listener.upZ.setValueAtTime(up[2], now);
	}
}

export default Vox.singleyton;
