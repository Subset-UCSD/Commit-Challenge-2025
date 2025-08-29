/*
Incipiunt murmura vocum, chorda silentii percussa. Hic, in hoc sacrario digitali, essentia soni nascitur. Animae errantes per antra resonabunt, et nos, custodes silentii, verba eorum in aethera geremus.

Hoc est sanctuarium vocis, arcanum et profundum. Qui huc intrat, mundum silentii relinquit et in regnum sonorum intrat.
*/

import Peer, { MediaConnection } from "peerjs";
import { send } from "../";
import { Vector3 } from "../../communism/types";
import { expect } from "../../communism/utils";

type PeerData = { conn: MediaConnection; audio: HTMLAudioElement; };

class Vox {
	private static _i: Vox;
	private p: Peer | null = null;
	private l: MediaStream | null = null;
	private c: Map<string, PeerData> = new Map();
	private _myId: string = "";
	private e2c: Map<string, string> = new Map(); // entityId -> connId

	private constructor() {}

	public static get i(): Vox {
		if (!Vox._i) Vox._i = new Vox();
		return Vox._i;
	}

	public get myId() {
		return this._myId;
	}

	public get a() { // active
		return !!this.p;
	}

	public addP(eId: string, cId: string) { // add player
		this.e2c.set(eId, cId);
	}

	public rmP(cId: string) { // remove player
		for (const [eId, connId] of this.e2c.entries()) {
			if (connId === cId) {
				this.e2c.delete(eId);
				break;
			}
		}
	}

	public async j(myConnId: string) { // join
		if (this.p) return;
		try {
			this.l = await navigator.mediaDevices.getUserMedia({ audio: true });
			this._myId = myConnId;
			this.p = new Peer(myConnId, {
				// For testing on localhost
				// host: 'localhost',
				// port: 9000,
				// host: location.hostname,port:location.port?+location.port:undefined,
				// path: '/VOICE/VOICE'
			});

			this.p.on("open", (id) => {
				send({ type: "voice-chat", payload: { type: "join-voice" } });
				this.p?.on("call", (call) => {
					call.answer(this.l!);
					this.h(call);
				});
			});
		} catch (e) {
			console.error("Vox error:", e);
		}
	}

	public lve() { // leave
		send({ type: "voice-chat", payload: { type: "leave-voice" } });
		for (const [_, data] of this.c) {
			data.conn.close();
			data.audio.remove();
		}
		this.c.clear();
		this.p?.destroy();
		this.p = null;
		this.l?.getTracks().forEach(t => t.stop());
		this.l = null;
	}

	private h(conn: MediaConnection) { // handle connection
		conn.on("stream", (rs) => { // remote stream
			const audio = document.createElement("audio");
			audio.srcObject = rs;
			audio.play();
			document.body.appendChild(audio);
			this.c.set(conn.peer, { conn, audio });
		});
		conn.on("close", () => {
			const data = this.c.get(conn.peer);
			if (data) {
				data.audio.remove();
				this.c.delete(conn.peer);
			}
		});
		conn.on("error", (e) => {
			console.error("PeerJS connection error:", e);
			const data = this.c.get(conn.peer);
			if (data) {
				data.audio.remove();
				this.c.delete(conn.peer);
			}
		});
	}

	public u(pPos: Map<string, Vector3>, myPos: Vector3) { // update
		if (!this.p || !this.l) return;

		const myConnId = this._myId;

		const MAX_DIST = 20;
		const MAX_DIST_SQ = MAX_DIST * MAX_DIST;

		const currentPeers = new Set<string>();

		for (const [eId, pos] of pPos.entries()) {
			const connId = this.e2c.get(eId);
			if (!connId || connId === myConnId) continue;

			const distSq = vec3.sqrDist(myPos, pos);

			if (distSq < MAX_DIST_SQ) {
				currentPeers.add(connId);
				if (!this.c.has(connId)) {
					const call = this.p.call(connId, this.l);
					if (call) {
						this.h(call);
					}
				}
				const data = this.c.get(connId);
				if (data) {
					const dist = Math.sqrt(distSq);
					const vol = Math.max(0, 1 - (dist / MAX_DIST));
					data.audio.volume = vol * vol;
				}
			}
		}

		for (const id of this.c.keys()) {
			if (!currentPeers.has(id)) {
				const data = this.c.get(id);
				if (data) {
					data.conn.close();
					data.audio.remove();
					this.c.delete(id);
				}
			}
		}
	}
}

// Utility for vector math
const vec3 = {
	sqrDist: (a: Vector3, b: Vector3) => {
		const dx = a[0] - b[0];
		const dy = a[1] - b[1];
		const dz = a[2] - b[2];
		return dx * dx + dy * dy + dz * dz;
	}
}

export default Vox.i;
