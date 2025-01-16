import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { handleClientMessage, ServerMessage, State } from "./Messaging";

const app = express();

const server = http.createServer(app);

const wss = new WebSocketServer({server: server});

const state :State= {
	balls: []
}

function send(ws: WebSocket,  data: ServerMessage) {
	ws.send(JSON.stringify(data));
}

wss.on("connection", ws => {
	const ball = {x:0,y:0}
	state.balls.push(ball)
	setInterval(()=>{
		ball.x += Math.random() * 35
		ball.y += Math.random() * 20
		if (ball.x > 1000) {
			ball.x = 0
		}
		if (ball.y > 1000) {
			ball.y = 0
		}
		send(ws, {"type": "ping"});
		send(ws, {"type": "state",state});
	}, 250)
	ws.on("message", handleClientMessage);

	ws.on("close", () => {});
});

app.get("/", (_, res) => {
	res.sendFile(path.join(__dirname, "../public", "index.html"))
});

app.use(express.static(path.join(__dirname, "../public")))

server.listen(8080);
console.log('http://localhost:8080/')
