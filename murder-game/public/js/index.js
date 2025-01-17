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
var x = 0;
var y = 0;
var lastReportedX = 0;
var lastReportedY = 0;
setInterval(() => {
  if (lastReportedX !== x || lastReportedY !== y) {
    lastReportedX = x;
    lastReportedY = y;
    send({ type: "move", x, y });
  }
}, 250);
function send(data) {
  ws.send(JSON.stringify(data));
}
function draw() {
  c?.clearRect(0, 0, cnv.width, cnv.height);
  c?.fillText("amogus", 50, 50);
  if (!c) {
    return;
  }
  c.fillStyle = "red";
  for (const { x: x2, y: y2 } of state.bullets) {
    c.fillRect(x2 - 1, y2 - 1, 2, 2);
    c.fillText("this is a bullet", x2, y2);
  }
  for (const [i, { x: x2, y: y2, kills, deaths }] of Object.entries(state.balls)) {
    c.fillStyle = `hsl(${+i * 57}, 50%, 50%)`;
    c.beginPath();
    c.moveTo(x2 + 10, y2);
    c.arc(x2, y2, 10, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillText("hi i have kilt " + kills + ",die " + deaths, x2, y2 - 10);
    if (+i === myUserId) {
      c.fillText("(this is you!!)", x2, y2 + 10);
    }
  }
  requestAnimationFrame(draw);
}
draw();
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    x -= 5;
  }
  if (e.key === "ArrowRight") {
    x += 5;
  }
  if (e.key === "ArrowUp") {
    y -= 5;
  }
  if (e.key === "ArrowDown") {
    y += 5;
  }
  state.balls[myUserId].x = x;
  state.balls[myUserId].y = y;
});
document.addEventListener("click", (e) => {
  const dx = e.clientX - x;
  const dy = e.clientY - y;
  const length = Math.hypot(dx, dy);
  send({ type: "bullet", xv: dx / length * 30, yv: dy / length * 30 });
});
//# sourceMappingURL=index.js.map
