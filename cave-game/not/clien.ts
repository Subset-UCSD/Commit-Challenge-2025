// clients but singular

import { makeWs } from "../client/net";
import { decode, encode, Message, MessageType } from "./msg";

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
		try {
			send({ type: MessageType.SessionId, id: Uint8Array.from(JSON.parse(localStorage.getItem(key) ?? "")) });
		} catch {
			send({ type: MessageType.HiImNew });
		}
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
			default: {
				console.warn("%c[unknown msg]", "font-weight: bold", message);
			}
		}
	},
});

const button = document.createElement("button");
button.textContent = "click me";
button.addEventListener("click", () => {
	const wow = prompt("what do u wanna tell the world");
	if (wow !== null) {
		send({ type: MessageType.TempButtonPress, message: wow });
	}
});
document.body.append(button);
