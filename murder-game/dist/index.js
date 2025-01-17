var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server/index.ts
var import_express = __toESM(require("express"));
var import_http = __toESM(require("http"));
var import_path = __toESM(require("path"));
var import_ws = require("ws");
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var wss = new import_ws.WebSocketServer({ server });
var state = {
  balls: {},
  bullets: []
};
function send(ws, data) {
  ws.send(JSON.stringify(data));
}
function sendAll(data) {
  for (const ws of [...wses]) {
    if (ws.readyState === import_ws.WebSocket.CLOSED || ws.readyState === import_ws.WebSocket.CLOSING) {
      wses.delete(ws);
      continue;
    }
    send(ws, data);
  }
}
setInterval(() => {
  for (const b of state.bullets) {
    b.x += b.xv;
    b.y += b.yv;
    for (const p of Object.values(state.balls)) {
      if (Math.hypot(p.x - b.x, p.y - b.y) < 10) {
        p.x = Math.floor(Math.random() * 300);
        p.y = Math.floor(Math.random() * 300);
        p.kills = 0;
        p.deaths++;
        state.balls[b.owner].kills++;
        b.dieTime = 0;
      }
    }
  }
  state.bullets = state.bullets.filter((b) => b.dieTime > Date.now());
  sendAll({ "type": "state", state });
}, 20);
var wses = /* @__PURE__ */ new Set();
var id = 0;
wss.on("connection", (ws) => {
  wses.add(ws);
  const userId = id++;
  const ball = { userId, x: Math.floor(Math.random() * 300), y: Math.floor(Math.random() * 300), kills: 0, deaths: 0 };
  state.balls[userId] = ball;
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
      case "move":
        ball.x = parsed.x;
        ball.y = parsed.y;
        break;
      case "bullet":
        state.bullets.push({ x: ball.x, y: ball.y, xv: parsed.xv, yv: parsed.yv, dieTime: Date.now() + 1e3, owner: userId });
        break;
    }
  }
  ws.on("message", handleClientMessage);
  ws.on("close", () => {
    wses.delete(ws);
  });
  send(ws, { type: "you-are", userId });
});
app.get("/", (_, res) => {
  res.sendFile(import_path.default.join(__dirname, "../public", "index.html"));
});
app.use(import_express.default.static(import_path.default.join(__dirname, "../public")));
server.listen(8080);
console.log("http://localhost:8080/");
