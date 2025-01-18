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

// server/obstickes.ts
var xywh = (x, y, width, height) => ({ x, y, width, height });
var xxyy = (x1, x2, y1, y2) => ({ x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.max(x1, x2) - Math.min(x1, x2), height: Math.max(y1, y2) - Math.min(y1, y2) });
var boundarySize = 1e3;
var boundaryBorderSize = 50;
var obstacles = [
  xxyy(-boundarySize - boundaryBorderSize, -boundarySize, -boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize),
  xxyy(-boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize, -boundarySize - boundaryBorderSize, -boundarySize),
  xxyy(-boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize, boundarySize, boundarySize + boundaryBorderSize),
  xxyy(boundarySize, boundarySize + boundaryBorderSize, -boundarySize - boundaryBorderSize, boundarySize + boundaryBorderSize),
  xywh(-800, -800, 200, 200),
  xywh(600, -800, 200, 200),
  xywh(-800, -300, 200, 200),
  xywh(600, -300, 200, 200),
  xywh(-800, 100, 200, 200),
  xywh(600, 100, 200, 200),
  xywh(-800, 600, 200, 200),
  xywh(-500, -500, 100, 100),
  xywh(-500, 400, 100, 100),
  xywh(-500, -100, 100, 200),
  xywh(400, -100, 100, 200),
  xywh(400, -500, 100, 100),
  xywh(400, 400, 100, 100),
  xywh(-400, -800, 800, 100),
  xywh(-400, 700, 800, 100),
  xywh(-200, -500, 400, 100),
  xywh(-200, 400, 400, 100)
];
var inside = ({ x, y }, o) => o.x <= x && x <= o.x + o.width && o.y <= y && y <= o.y + o.height;
var insideAny = (p) => obstacles.some((o) => inside(p, o));

// server/index.ts
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var wss = new import_ws.WebSocketServer({ server });
var state = {
  balls: {},
  bullets: []
};
var ballToWs = /* @__PURE__ */ new WeakMap();
var ballSteps = 5;
var maxBalls = 1234;
function send(ws, data) {
  ws?.send(JSON.stringify(data));
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
  for (let i = 0; i < ballSteps; i++) {
    for (const b of state.bullets) {
      b.x += b.xv / ballSteps;
      b.y += b.yv / ballSteps;
      for (const p of Object.values(state.balls)) {
        if (Math.hypot(p.x - b.x, p.y - b.y) < 10) {
          if (b.owner === p.userId) continue;
          p.x = Math.floor(Math.random() * 300);
          p.y = Math.floor(Math.random() * 300);
          send(ballToWs.get(p), { type: "please-move", x: p.x, y: p.y });
          send(ballToWs.get(p), { type: "die" });
          p.kills = 0;
          p.deaths++;
          state.balls[b.owner].kills++;
          b.dieTime = 0;
        }
      }
    }
  }
  state.bullets = state.bullets.filter((b) => b.dieTime > Date.now() && !insideAny(b)).slice(-maxBalls);
  for (const p of Object.values(state.balls)) {
    if (insideAny(p)) {
      p.x = Math.floor(Math.random() * 300);
      p.y = Math.floor(Math.random() * 300);
      send(ballToWs.get(p), { type: "please-move", x: p.x, y: p.y });
      send(ballToWs.get(p), { type: "die" });
      p.kills = 0;
      p.deaths++;
    }
  }
  sendAll({ "type": "state", state });
}, 20);
var wses = /* @__PURE__ */ new Set();
var anticheatMovementLimiter = 100;
var id = 0;
wss.on("connection", (ws) => {
  wses.add(ws);
  const userId = id++;
  const ball = { userId, x: Math.floor(Math.random() * 300) - 150, y: Math.floor(Math.random() * 300) - 150, kills: 0, deaths: 0 };
  state.balls[userId] = ball;
  ballToWs.set(ball, ws);
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
        if (parsed.x - ball.x > anticheatMovementLimiter || parsed.y - ball.y > anticheatMovementLimiter || parsed.x - ball.x < -anticheatMovementLimiter || parsed.y - ball.y < -anticheatMovementLimiter)
          break;
        ball.x = parsed.x;
        ball.y = parsed.y;
        break;
      case "bullet":
        state.bullets.push({ x: ball.x, y: ball.y, xv: parsed.xv, yv: parsed.yv, dieTime: Date.now() + 1500, owner: userId });
        break;
    }
  }
  ws.on("message", handleClientMessage);
  ws.on("close", () => {
    wses.delete(ws);
    ballToWs.delete(ball);
  });
  send(ws, { type: "you-are", userId });
  send(ws, { type: "please-move", x: ball.x, y: ball.y });
});
app.get("/", (_, res) => {
  res.sendFile(import_path.default.join(__dirname, "../public", "index.html"));
});
app.use(import_express.default.static(import_path.default.join(__dirname, "../public")));
server.listen(8080);
console.log("http://localhost:8080/");
