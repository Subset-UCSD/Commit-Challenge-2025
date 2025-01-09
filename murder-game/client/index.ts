import { ClientMessage, ServerMessage } from "../server/Messaging";

const cnv = document.getElementById('cnv') as HTMLCanvasElement;
const ws = new WebSocket(window.location.href.replace(/^http/, "ws").replace(/\/$/, "").replace(/^https/, "wss"));

cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

const c = cnv.getContext("2d");

ws.addEventListener("message", handleServerMessage);

function handleServerMessage(data: any) {
	let msg: ServerMessage | null = null;
	try {
		msg = JSON.parse(data);
	} catch (e) {}
	if (!msg) return;

	switch (msg.type) {
		case "ping":
			console.log("Received ping...");
			send({"type": "pong"});
			break;
	}
}

function send(data: ClientMessage) {
	ws.send(JSON.stringify(data));
}

function draw() {
	requestAnimationFrame(draw);
}