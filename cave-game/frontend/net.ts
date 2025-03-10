import { ClientMessage, ServerMessage } from "../communism/messages";
import { sleep } from "../communism/utils";
import { handleConnectionStatus, handleMessage, handleOpen } from ".";

let ws = makeWs();
let reconnectTime = 0;
function makeWs(): WebSocket {
	ws = new WebSocket(new URL("/fuck", window.location.origin.replace("http", "ws")));

	ws.addEventListener("open", () => {
		handleConnectionStatus(true);
		reconnectTime = 0;

		handleOpen();
	});

	ws.addEventListener("close", () => {
		console.log("😭ws closed");
		handleConnectionStatus(false);

		// attempt reconnection
		sleep(reconnectTime).then(() => {
			makeWs();
		});
		reconnectTime = reconnectTime * 2 || 1000;
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

	return ws;
}

export function send(message: ClientMessage): void {
	if (ws.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	} else {
		// drop it. who cares
	}
}
