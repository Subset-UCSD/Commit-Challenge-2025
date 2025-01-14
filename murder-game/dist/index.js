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
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var wss = new import_ws.WebSocketServer({ server });
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
  res.sendFile(import_path.default.join(__dirname, "../public", "index.html"));
});
app.use(import_express.default.static(import_path.default.join(__dirname, "../public")));
server.listen(8080);
