import { ClientMessage, ServerMessage, State } from "../server/Messaging";

const cnv = document.getElementById('cnv') as HTMLCanvasElement;
const ws = new WebSocket(window.location.href.replace(/^http/, "ws").replace(/\/$/, "").replace(/^https/, "wss"));

cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

const c = cnv.getContext("2d");

ws.addEventListener("message", handleServerMessage);

let state:State={
	balls:[{x:150,y:150},{x:800,y:870},{x:500,y:300}]
}

function handleServerMessage(data: MessageEvent) {
	let msg: ServerMessage | null = null;
	try {
		msg = JSON.parse(data.data);
	} catch (e) {}
	if (!msg) return;

	switch (msg.type) {
		case "ping":
			console.log("Received ping...");
			send({"type": "pong"});
			break;
		case 'state':
			state = msg.state
			break
	}
}

function send(data: ClientMessage) {
	ws.send(JSON.stringify(data));
}

function draw() {
	c?.clearRect(0,0,cnv.width,cnv.height)
	
	c?.fillText('amogus',50, 50)
	if (!c){return}
	for (const [i, {x,y}] of state.balls.entries()) {
		c.fillStyle = `hsl(${i * 57}, 50%, 50%)`
		c.beginPath()
		c.moveTo(x + 10, y)
		c.arc(x,y,10,0,Math.PI*2,)
		c.fill()
		c.stroke()
	}
	requestAnimationFrame(draw);
}
draw()