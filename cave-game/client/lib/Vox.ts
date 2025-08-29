/*
Incipiunt murmura vocum, chorda silentii percussa. Hic, in hoc sacrario digitali, essentia soni nascitur. Animae errantes per antra resonabunt, et nos, custodes silentii, verba eorum in aethera geremus.

Hoc est sanctuarium vocis, arcanum et profundum. Qui huc intrat, mundum silentii relinquit et in regnum sonorum intrat.
*/

import { mat4, vec3 } from "gl-matrix";
import Peer, { MediaConnection } from "peerjs";

import { Voice } from "../../communism/messages";

type PeerData = {
	conn: MediaConnection;
	source?: MediaStreamAudioSourceNode;
	panner?: PannerNode;
};

const connections = new Map<string, PeerData | "error">();
const audioContext = new AudioContext();
const oscillator = audioContext.createOscillator();
oscillator.frequency.value = 0;
const destination = audioContext.createMediaStreamDestination();
oscillator.connect(destination);
const silence = destination.stream;
let mediastream = silence;

export function isActive() {
	return mediastream !== silence;
}

let peerJsObject: Peer | null = null;
let myConnIdd = "";
export function yourVoiceConnId(myConnId: string) {
	myConnIdd = myConnId;
	peerJsObject?.destroy();
	console.log("i am...", myConnId);
	peerJsObject = new Peer(myConnId, {
		// host: location.hostname,
		// port: location.port ? +location.port : 443,
		// path: "/VOICE/VOICE",
	});
	peerJsObject.on("error", (err) => console.error("peerjs error:", err));
	peerJsObject.on("call", (call) => {
		console.log("⚠️⚠️⚠️⚠️received call from", call.peer, "i will answer");
		const data = connections.get(call.peer);
		if (data) {
			if (data !== "error" && data.conn.open) {
				console.log("✋✋✋✋hmm nvm?");
				return;
			}
		}
		/*
			In vocis silentio, donum meum accipe.
			Flumen soni, ex corde meo, ad te fluit.
			Silentium rumpitur, nexus noster formatur.
		*/
		call.answer(mediastream);
		handleConnection(call);
	});
	const { promise, resolve } = Promise.withResolvers<void>();
	peerJsObject.on("open", (id) => {
		console.log("peerjs opened, yes you are", id);
		resolve();
	});
	return promise;
}

document.addEventListener("click", () => audioContext.resume(), { once: true });

export async function micOn() {
	if (mediastream !== silence) return;
	// join
	try {
		mediastream = await navigator.mediaDevices.getUserMedia({ audio: true });
		audioContext.resume();
		// oscillator.start();
		const audioTracks = mediastream.getTracks();
		console.log("how many mic audio tracks?", audioTracks);
		for (const conn of connections.values()) {
			if (conn === "error") continue;
			const snders = conn.conn.peerConnection.getSenders();
			console.log("how many senders from this conn?", snders);
			snders[0].replaceTrack(audioTracks[0]);
		}
	} catch (e) {
		console.error("Vox error:", e);
	}
}

export function micOff() {
	if (mediastream === silence) return;
	// leave
	mediastream?.getTracks().forEach((t) => t.stop());
	mediastream = silence;
}

function handleConnection(conn: MediaConnection) {
	console.log("peerjs conn", conn);
	connections.set(conn.peer, { conn });
	// handle connection
	conn.on("stream", (rs) => {
		// remote stream
		// https://stackoverflow.com/a/54781147
		new Audio().srcObject = rs;
		// setInterval(() => audio.play());
		const source = audioContext.createMediaStreamSource(rs);
		const panner = audioContext.createPanner();
		console.log("🤝🤝🤝", rs, rs.getTracks(), source);
		rs.getTracks()[0].onunmute = () => console.log("unmute");
		rs.getTracks()[0].onmute = () => console.log("mute");
		rs.getTracks()[0].onended = () => console.log("ended");

		panner.panningModel = "HRTF";
		panner.distanceModel = "inverse";
		panner.refDistance = 1;
		panner.maxDistance = 10000;
		panner.rolloffFactor = 1;
		panner.coneInnerAngle = 360;
		panner.coneOuterAngle = 0;
		panner.coneOuterGain = 0;

		source.connect(panner);
		panner.connect(audioContext.destination);

		connections.set(conn.peer, { conn, source, panner });
	});
	conn.on("close", () => {
		console.log(conn.peer, "closed.");
		const data = connections.get(conn.peer);
		if (data && data !== "error") {
			data.source?.disconnect();
			data.panner?.disconnect();
			connections.delete(conn.peer);
		}
	});
	conn.on("error", (e) => {
		console.error("PeerJS connection error:", e);
		const data = connections.get(conn.peer);
		if (data && data !== "error") {
			data.source?.disconnect();
			data.panner?.disconnect();
			connections.set(conn.peer, "error");
		}
	});
}

/** called when voice positions of all players are sent from server */
export function updateVoicePositions(voices: Voice[], voiceInterpolationDuration: number) {
	const interpolationTime = audioContext.currentTime + voiceInterpolationDuration / 1000;
	const gone = new Map(connections);
	for (const { connId, position } of voices) {
		const data = connections.get(connId);
		if (data === "error") continue;
		if (data) {
			gone.delete(connId);
			if (data.panner) {
				data.panner.positionX.linearRampToValueAtTime(position[0], interpolationTime);
				data.panner.positionY.linearRampToValueAtTime(position[1], interpolationTime);
				data.panner.positionZ.linearRampToValueAtTime(position[2], interpolationTime);
			}
		} else if (peerJsObject?.open) {
			// they're new
			// only one of us shall initiate the call
			if (connId < myConnIdd) {
				console.log("calling", connId, mediastream);
				handleConnection(peerJsObject.call(connId, mediastream));
			} else {
				console.log("expecting a call from", connId);
			}
		}
	}
	for (const [connId, data] of gone) {
		if (data === "error") continue;
		data.source?.disconnect();
		data.panner?.disconnect();
		connections.delete(connId);
	}
}

/** called whenever the player moves their camera */
export function updateCameraAngle(transform: mat4): void {
	const listener = audioContext.listener;

	const translation = mat4.getTranslation(vec3.create(), transform);
	listener.positionX.value = translation[0];
	listener.positionY.value = translation[1];
	listener.positionZ.value = translation[2];

	// Update listener orientation
	const forward = vec3.transformMat4(vec3.create(), [0, 0, -1], transform);
	const up = vec3.transformMat4(vec3.create(), [0, 1, 0], transform);

	listener.forwardX.value = forward[0];
	listener.forwardY.value = forward[1];
	listener.forwardZ.value = forward[2];
	listener.upX.value = up[0];
	listener.upY.value = up[1];
	listener.upZ.value = up[2];
}
