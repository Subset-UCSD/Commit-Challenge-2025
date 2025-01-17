import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { Ball,  ClientMessage,  ServerMessage, State } from "./Messaging";

const app = express();

const server = http.createServer(app);

const wss = new WebSocketServer({server: server});

const state :State= {
	balls: {},bullets:[]
}

function send(ws: WebSocket,  data: ServerMessage) {
	ws.send(JSON.stringify(data));
}
function sendAll(  data: ServerMessage) {
	// ws.send(JSON.stringify(data));
	for (const ws of [...wses]){
		if (ws.readyState===WebSocket.CLOSED||ws.readyState===WebSocket.CLOSING){
			wses.delete(ws)
			continue
		}
		send(ws,data)
	}
}
setInterval(()=>{
	// ball.x += Math.random() * 35
	// ball.y += Math.random() * 20
	// if (ball.x > 1000) {
	// 	ball.x = 0
	// }
	// if (ball.y > 1000) {
	// 	ball.y = 0
	// }
	// send(ws, {"type": "ping"});
	for (const b of state.bullets) {
		b.x += b.xv
		b.y += b.yv
		for (const p of Object.values(state.balls)) {
			if (Math.hypot(p.x - b.x, p.y-b.y)<10){
				p.x=Math.floor(Math.random() * 300)
				p.y = Math.floor(Math.random() * 300)
				p.kills = 0
				p.deaths++
				state.balls[b.owner] .kills++
				b.dieTime=0
			}
		}
	}
	state.bullets = state.bullets.filter(b => b.dieTime > Date.now())
	sendAll( {"type": "state",state});
}, 20)

const wses=new Set<WebSocket>()

let id = 0
wss.on("connection", ws => {
	wses.add(ws)
	const userId = id++
	const ball :Ball= {userId,x:Math.floor(Math.random() * 300),y:Math.floor(Math.random() * 300),kills:0,deaths:0}
	state.balls[userId]=(ball)
	function handleClientMessage(data: any) {
		let parsed: ClientMessage | null = null;
		try {
			parsed = JSON.parse(data);
		} catch (e) {}
		if (!parsed) return;
	
		switch (parsed.type) {
			case "pong":
				console.log("Got pong...");
				break;
			case 'move':
				ball.x = parsed.x
				ball.y = parsed.y
				break
			case "bullet":
				state.bullets.push({x:ball.x,y:ball.y,xv:parsed.xv,yv:parsed.yv,dieTime:Date.now()+1000,owner:userId})
				break
		}
	}
	ws.on("message", handleClientMessage);

	ws.on("close", () => {wses.delete(ws)});

	send(ws,{type:'you-are',userId})
});

app.get("/", (_, res) => {
	res.sendFile(path.join(__dirname, "../public", "index.html"))
});

app.use(express.static(path.join(__dirname, "../public")))

server.listen(8080);
console.log('http://localhost:8080/')
