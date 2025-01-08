import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { handleMessage } from "./modules/Messaging";

const app = express();

const server = http.createServer(app);

const wss = new WebSocketServer({server: server});

wss.on("connection", ws => {	
	ws.on("message", handleMessage);

	ws.on("close", () => {});
});

app.get("/", (_, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"))
});

app.use(express.static(path.join(__dirname, "public")))

server.listen(8080);
