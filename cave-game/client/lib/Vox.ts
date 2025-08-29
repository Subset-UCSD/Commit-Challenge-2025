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
			this.#audioContext ??= new AudioContext();
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
		// this.#audioContext?.close();
		// this.#audioContext = null;
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
			console.log(source, rs);

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

		const myPos = voices.find((voice) => this.#entityToConnectionmap.get(voice.playerEntityId) === myConnId)?.position;
		if (myPos) {
			for (const { playerEntityId, position } of voices) {
				const connId = this.#entityToConnectionmap.get(playerEntityId);
				if (!connId || connId === myConnId) continue;

				const data = this.#connections.get(connId);
				if (data) {
					data.panner.positionX.linearRampToValueAtTime(position[0] - myPos[0], interpolationTime);
					data.panner.positionY.linearRampToValueAtTime(position[1] - myPos[1], interpolationTime);
					data.panner.positionZ.linearRampToValueAtTime(position[2] - myPos[2], interpolationTime);
				}
			}
		}
	}

	/** called whenever the player moves their camera */
	updateCameraAngle(angle: YXZEuler): void {
		if (!this.#audioContext) return;

		const listener = this.#audioContext.listener;
		const now = this.#audioContext.currentTime;

		// Update listener position
		// listener.positionX.setValueAtTime(cameraPosition[0], now);
		// listener.positionY.setValueAtTime(cameraPosition[1], now);
		// listener.positionZ.setValueAtTime(cameraPosition[2], now);

		// Update listener orientation
		const camMatrix = cameraTransform(null, angle);
		const forward = vec3.transformMat4(vec3.create(), [0, 0, -1], camMatrix);
		const up = vec3.transformMat4(vec3.create(), [0, 1, 0], camMatrix);

		listener.forwardX.value = forward[0];
		listener.forwardY.value = forward[1];
		listener.forwardZ.value = forward[2];
		listener.upX.value = up[0];
		listener.upY.value = up[1];
		listener.upZ.value = up[2];
	}
}

export default Vox.singleyton;
