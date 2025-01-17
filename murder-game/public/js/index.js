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
  }
}
function send(data) {
  if (ws.readyState == WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function draw() {
  if (!c) {
    return;
  }
  c.fillStyle = "red";
  for (const { x, y } of state.bullets) {
    c.fillRect(x - 1, y - 1, 2, 2);
    c.fillText("this is a bullet", x, y);
  }
  for (const [i, { x, y, kills, deaths }] of Object.entries(state.balls)) {
    c.fillStyle = `hsl(${+i * 57}, 50%, 50%)`;
    c.beginPath();
    c.moveTo(x + 10, y);
    c.arc(x, y, 10, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillText("hi i have kilt " + kills + ",die " + deaths, x, y - 10);
    if (+i === myUserId) {
      c.fillText("(this is you!!)", x, y + 10);
    }
  }
  requestAnimationFrame(draw);
}
draw();
var pos = { x: 0, y: 0 };
var movementInput = { x: 0, y: 0 };
var keysPressed = /* @__PURE__ */ new Set();
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
function handleKeyDown(event) {
  if (["w", "a", "s", "d"].includes(event.key.toLowerCase())) {
    keysPressed.add(event.key.toLowerCase());
    updateMovementInput();
  }
}
function handleKeyUp(event) {
  if (keysPressed.has(event.key.toLowerCase())) {
    keysPressed.delete(event.key.toLowerCase());
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
  pos.x += movementInput.x * speed2 * deltaTime;
  pos.y += movementInput.y * speed2 * deltaTime;
  send({
    type: "move",
    x: pos.x,
    y: pos.y
  });
}
var speed = 100;
var lastTime = performance.now();
function gameLoop() {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1e3;
  lastTime = currentTime;
  updatePosition(deltaTime, speed);
  requestAnimationFrame(gameLoop);
}
gameLoop();
document.addEventListener("click", (e) => {
  const dx = e.clientX - pos.x;
  const dy = e.clientY - pos.y;
  const length = Math.hypot(dx, dy);
  send({ type: "bullet", xv: dx / length * 30, yv: dy / length * 30 });
});
//# sourceMappingURL=index.js.map
