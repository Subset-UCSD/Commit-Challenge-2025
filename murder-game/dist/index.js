// server/index.ts
import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";

// server/Messaging.ts
function handleClientMessage(data) {
  let parsed = null;
  try {
    parsed = JSON.parse(data);
  } catch (e) {
  }
  if (!parsed) return;
  switch (parsed.type) {
    case "pong":
      console.log("Got pong...");
      break;
    case "bullet":
  }
}

// server/index.ts
var app = express();
var server = http.createServer(app);
var wss = new WebSocketServer({ server });
function send(ws, data) {
  ws.send(JSON.stringify(data));
}
wss.on("connection", (ws) => {
  setInterval(() => {
    send(ws, { "type": "ping" });
  }, 1e3);
  ws.on("message", handleClientMessage);
  ws.on("close", () => {
  });
});
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use(express.static(path.join(__dirname, "public")));
server.listen(8080);
