import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { handleClientMessage, ServerMessage } from "./Messaging";

const app = express();

const server = http.createServer(app);

const wss = new WebSocketServer({server: server});

function send(ws: WebSocket,  data: ServerMessage) {
	ws.send(JSON.stringify(data));
}

wss.on("connection", ws => {
	setInterval(()=>{
		send(ws, {"type": "ping"});
	}, 1000)
	ws.on("message", handleClientMessage);

	ws.on("close", () => {});
});

app.get("/", (_, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"))
});

app.use(express.static(path.join(__dirname, "public")))

server.listen(8080);
