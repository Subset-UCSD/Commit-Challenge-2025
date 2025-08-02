import { sleep } from "../communism/utils";

export type Handlers<ClientMessage, ServerMessage> = {
	open: () => void;
	message: (msg: ServerMessage) => void;
	parse: (data: string | ArrayBuffer | Blob) => ServerMessage;
	encode: (msg: ClientMessage) => string | ArrayBuffer | Blob;
	connectionStatus: (status: boolean) => void;
	useArrayBuffer: boolean;
};

function parseJson<T>(data: string | ArrayBuffer | Blob): T {
	if (typeof data !== "string") {
		console.error("server fucking sent us a", data);
		throw new Error("msg not string");
	}
	return JSON.parse(data);
}

export const FUCK_OFF = "fck";

export function makeWs<ClientMessage, ServerMessage>(
	path: string,
	handlers: Partial<Handlers<ClientMessage, ServerMessage>> = {},
	reconnectTime = 0,
	_wsRef: { ws?: WebSocket } = {},
): (msg: ClientMessage) => void {
	let ws = new WebSocket(new URL(path, window.location.origin.replace("http", "ws")));
	_wsRef.ws = ws;
	if (handlers.useArrayBuffer) {
		ws.binaryType = "arraybuffer";
	}

	ws.addEventListener("open", () => {
		handlers.connectionStatus?.(true);
		reconnectTime = 0;

		handlers.open?.();
	});

	ws.addEventListener("close", (e) => {
		console.log("😭ws closed", e.code, e.reason);
		handlers.connectionStatus?.(false);

		if (e.reason === FUCK_OFF) {
			console.log("the server doesnt want us anymore :(");
			return;
		}

		// attempt reconnection
		sleep(reconnectTime).then(() => {
			makeWs(path, handlers, reconnectTime * 2 || 1000, _wsRef);
		});
	});

	ws.addEventListener("message", (e) => {
		let message: ServerMessage;
		try {
			message = (handlers.parse ?? parseJson)(e.data);
		} catch {
			console.error("server fucking sent maldformed json", e.data);
			return;
		}
		handlers.message?.(message);
	});

	return (message) => {
		if (_wsRef.ws?.readyState === WebSocket.OPEN) {
			_wsRef.ws.send((handlers.encode ?? JSON.stringify)(message));
		} else {
			// drop it. who cares
			console.warn("message dropped lmao");
		}
	};
}
