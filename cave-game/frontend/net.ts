import { handleConnectionStatus, handleMessage } from ".";
import { ClientMessage, ServerMessage } from "../communism/messages";

const ws = new WebSocket(new URL("/fuck", window.location.origin.replace("http", "ws")));
ws.addEventListener("open", () => {
	handleConnectionStatus(true);
});

ws.addEventListener("close", () => {
	console.log("😭ws closed");
	handleConnectionStatus(false);
});

ws.addEventListener("message", (e) => {
	let message: ServerMessage;
	try {
		if (typeof e.data !== "string") {
			console.error("server fucking sent us a", e.data);
			return;
		}
		message = JSON.parse(e.data);
	} catch {
		console.error("server fucking sent maldformed json", e.data);
		return;
	}
	handleMessage(message);
});

export function send(message: ClientMessage): void {
	ws.send(JSON.stringify(message));
}
