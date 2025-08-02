// clients but singular

import { makeWs } from "../client/net";
import { decode, encode, Message, MessageType, WireframeData } from "./msg";

const key = "not user id";

const send = makeWs<Message, Message>("/not", {
	parse: (data) => {
		if (!(data instanceof ArrayBuffer)) {
			return { type: MessageType.Unknown, data };
		}
		return decode(data);
	},
	encode,
	useArrayBuffer: true,

	open: () => {
		let id: Uint8Array | undefined;
		try {
			id = Uint8Array.from(JSON.parse(localStorage.getItem(key) ?? ""));
		} catch {}
		if (id) {
			send({ type: MessageType.SessionId, id });
		} else {
			send({ type: MessageType.HiImNew });
		}
		// TEMP
		send({ type: MessageType.DebugWireframeEnable, enabled: true });
	},
	message: (message) => {
		switch (message.type) {
			case MessageType.Log: {
				console.log("%c[server]", "font-weight: bold", message.message);
				return;
			}
			case MessageType.SessionId: {
				console.log("i am now", message.id);
				localStorage.setItem(key, JSON.stringify(Array.from(message.id)));
				return;
			}
			case MessageType.Eval: {
				(MessageType.Eval, eval)(message.message); // ???
				return;
			}
			case MessageType.TempButtonPress: {
				alert(message.message);
				return;
			}
			case MessageType.DebugWireframe: {
				wireframes = message.json;
				c.fillStyle = "#fff1";
				c.fillRect(0, 0, what.width, what.height);
				c.beginPath();
				renderWireframes(c);
				c.stroke();
				return;
			}
			default: {
				console.warn("%c[unknown msg]", "font-weight: bold", message);
			}
		}
	},
});

const button = document.createElement("button");
button.textContent = "click me";
button.style.position = "absolute";
button.addEventListener("click", () => {
	const wow = prompt("what do u wanna tell the world");
	if (wow !== null) {
		send({ type: MessageType.TempButtonPress, message: wow });
	}
});
document.body.append(button);

let wireframes: WireframeData = { circles: [], vertices: [] };

function renderWireframes(c: CanvasRenderingContext2D): void {
	for (const { x, y, r } of wireframes.circles) {
		c.moveTo(x + r, y);
		c.arc(x, y, r, 0, Math.PI * 2);
	}
	for (const [[x, y], ...vertices] of wireframes.vertices) {
		c.moveTo(x, y);
		for (const [x, y] of vertices) {
			c.lineTo(x, y);
		}
		c.lineTo(x, y);
	}
}

const canvas = document.querySelector("canvas")!;
const c = canvas.getContext("2d")!;

let what = { width: 10, height: 10 };
new ResizeObserver(
	([
		{
			devicePixelContentBoxSize,
			contentBoxSize: [bruh],
		},
	]) => {
		const [{ blockSize, inlineSize }] = devicePixelContentBoxSize;
		canvas.width = inlineSize;
		canvas.height = blockSize;
		c.scale(inlineSize / bruh.inlineSize, blockSize / bruh.blockSize);
		what.width = bruh.inlineSize;
		what.height = bruh.blockSize;
	},
).observe(canvas);
