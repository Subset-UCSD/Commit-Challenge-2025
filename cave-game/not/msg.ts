export enum MessageType {
	Log = 0,
	SessionId = 1,
	HiImNew = 2,
	TempButtonPress = 3,
	Eval = 69,
	Unknown = 255,
}

export type Message =
	| { type: MessageType.Log | MessageType.Eval | MessageType.TempButtonPress; message: string }
	| { type: MessageType.SessionId; id: Uint8Array }
	| { type: MessageType.HiImNew }
	| { type: MessageType.Unknown; data: string | ArrayBuffer | Blob };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encode(message: Message): ArrayBuffer {
	switch (message.type) {
		case MessageType.Log:
		case MessageType.Eval:
		case MessageType.TempButtonPress: {
			const encoded = encoder.encode(message.message);
			const arr = new Uint8Array(encoded.length + 1);
			arr.set(encoded, 1);
			arr[0] = message.type;
			return arr.buffer;
		}
		case MessageType.SessionId: {
			const arr = new Uint8Array(message.id.length + 1);
			arr.set(message.id, 1);
			arr[0] = message.type;
			return arr.buffer;
		}
		case MessageType.HiImNew: {
			return new Uint8Array([message.type]).buffer;
		}
		case MessageType.Unknown: {
			return new Uint8Array([MessageType.Unknown]).buffer;
		}
	}
}

export function decode(message: ArrayBuffer): Message {
	const view = new DataView(message);
	const type = view.getUint8(0);
	switch (type) {
		case MessageType.Log:
		case MessageType.Eval:
		case MessageType.TempButtonPress: {
			return { type, message: decoder.decode(message.slice(1)) };
		}
		case MessageType.SessionId: {
			return { type, id: new Uint8Array(message.slice(1)) };
		}
		case MessageType.HiImNew: {
			return { type };
		}
		default: {
			return { type: MessageType.Unknown, data: message };
		}
	}
}
