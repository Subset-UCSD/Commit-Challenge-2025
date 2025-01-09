// client/index.ts
var cnv = document.getElementById("cnv");
var ws = new WebSocket(window.location.href.replace(/^http/, "ws").replace(/\/$/, "").replace(/^https/, "wss"));
cnv.width = window.innerWidth;
cnv.height = window.innerHeight;
var c = cnv.getContext("2d");
ws.addEventListener("message", handleServerMessage);
function handleServerMessage(data) {
  let msg = null;
  try {
    msg = JSON.parse(data);
  } catch (e) {
  }
  if (!msg) return;
  switch (msg.type) {
    case "ping":
      console.log("Received ping...");
      send({ "type": "pong" });
      break;
  }
}
function send(data) {
  ws.send(JSON.stringify(data));
}
//# sourceMappingURL=index.js.map
