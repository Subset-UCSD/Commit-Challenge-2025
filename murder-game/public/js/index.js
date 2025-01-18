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

// client/index.ts
var cnv = document.getElementById("cnv");
var ws = new WebSocket(window.location.href.replace(/^http/, "ws").replace(/\/$/, "").replace(/^https/, "wss"));
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;
var c = cnv.getContext("2d");
ws.addEventListener("message", handleServerMessage);
var state = {
  balls: {},
  bullets: []
};
var myUserId = -1;
function handleServerMessage(data) {
  let msg = null;
  try {
    msg = JSON.parse(data.data);
  } catch (e) {
  }
  if (!msg) return;
  switch (msg.type) {
    case "ping":
      console.log("Received ping...");
      send({ "type": "pong" });
      break;
    case "state":
      state = msg.state;
      break;
    case "you-are":
      myUserId = msg.userId;
      break;
    case "please-move":
      pos.x = msg.x;
      pos.y = msg.y;
      vel.x = 0;
      vel.y = 0;
      break;
    case "die":
      const bruh = Object.assign(document.createElement("div"), { className: Math.random() < 0.5 ? "variation" : "help" });
      document.body.append(bruh);
      setTimeout(() => bruh.remove(), 500);
      break;
  }
}
function send(data) {
  if (ws.readyState == WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function mod(a, b) {
  return (a % b + b) % b;
}
var GRID_SIZE = 50;
var cameraX = 0;
var cameraY = 0;
function draw() {
  cameraX += (pos.x - window.innerWidth / 2 - cameraX) * 0.3;
  cameraY += (pos.y - window.innerHeight / 2 - cameraY) * 0.3;
  c?.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (!c) {
    return;
  }
  c.save();
  c.strokeStyle = "#eee";
  c.beginPath();
  const startX = mod(-cameraX, GRID_SIZE);
  const startY = mod(-cameraY, GRID_SIZE);
  for (let x = startX; x < startX + window.innerWidth; x += GRID_SIZE) {
    c.moveTo(x, 0);
    c.lineTo(x, window.innerHeight);
  }
  for (let y = startY; y < startY + window.innerHeight; y += GRID_SIZE) {
    c.moveTo(0, y);
    c.lineTo(window.innerWidth, y);
  }
  c.stroke();
  c.translate(-cameraX, -cameraY);
  c.fillStyle = `hsl(${Math.sin(Date.now() / 100) * 10 + 30},100%,50%)`;
  for (const { x, y, width, height } of obstacles) {
    c.fillRect(x, y, width, height);
  }
  c.strokeStyle = "black";
  c.fillStyle = "red";
  for (const { x, y } of state.bullets) {
    c.fillRect(x - 2, y - 2, 4, 4);
  }
  for (let [i, { x, y, kills, deaths }] of Object.entries(state.balls)) {
    if (+i === myUserId) {
      x = pos.x;
      y = pos.y;
      c.fillText("(this is you!!)", x, y + 10);
    }
    c.fillStyle = `hsl(${+i * 57}, 50%, 50%)`;
    c.beginPath();
    c.moveTo(x + 10, y);
    c.arc(x, y, 10, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillText("hi i have kilt " + kills + ",die " + deaths, x, y - 10);
  }
  c.restore();
}
var pos = { x: 0, y: 0 };
var vel = { x: 0, y: 0 };
var movementInput = { x: 0, y: 0 };
var keysPressed = /* @__PURE__ */ new Set();
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
var map = { w: "w", a: "a", s: "s", d: "d", arrowleft: "a", arrowdown: "s", arrowup: "w", arrowright: "d" };
function handleKeyDown(event) {
  if (map[event.key.toLowerCase()]) {
    keysPressed.add(map[event.key.toLowerCase()]);
    updateMovementInput();
  }
}
function handleKeyUp(event) {
  if (keysPressed.has(map[event.key.toLowerCase()])) {
    keysPressed.delete(map[event.key.toLowerCase()]);
    updateMovementInput();
  }
}
function updateMovementInput() {
  let x = 0, y = 0;
  if (keysPressed.has("w")) y -= 1;
  if (keysPressed.has("s")) y += 1;
  if (keysPressed.has("a")) x -= 1;
  if (keysPressed.has("d")) x += 1;
  const length = Math.sqrt(x * x + y * y);
  if (length > 0) {
    movementInput = { x: x / length, y: y / length };
  } else {
    movementInput = { x: 0, y: 0 };
  }
}
function updatePosition(deltaTime, speed2) {
  vel.x += movementInput.x * speed2 * deltaTime;
  vel.y += movementInput.y * speed2 * deltaTime;
  vel.x *= 0.9;
  vel.y *= 0.9;
  pos.x += vel.x * deltaTime;
  pos.y += vel.y * deltaTime;
  send({
    type: "move",
    x: pos.x,
    y: pos.y
  });
}
var speed = 2e3;
var lastTime = performance.now();
console.log("hey");
function gameLoop() {
  const currentTime = performance.now();
  requestAnimationFrame(gameLoop);
  if (currentTime < lastTime + 1e3 / 80) {
    return;
  }
  const deltaTime = (currentTime - lastTime) / 1e3;
  lastTime = currentTime;
  updatePosition(deltaTime, speed);
  draw();
}
gameLoop();
var fireRate = 5;
var lastClick = performance.now();
document.addEventListener("click", (e) => {
  const currentTime = performance.now();
  if (currentTime < lastClick + 1e3 / fireRate) {
    return;
  }
  const dx = e.clientX - pos.x + cameraX;
  const dy = e.clientY - pos.y + cameraY;
  const length = Math.hypot(dx, dy);
  send({ type: "bullet", xv: dx / length * 20, yv: dy / length * 20 });
});
//# sourceMappingURL=index.js.map
