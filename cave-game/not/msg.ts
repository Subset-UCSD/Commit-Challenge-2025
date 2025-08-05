export enum MessageType {
	Log = 0,
	SessionId = 1,
	HiImNew = 2,
	TempButtonPress = 3,
	DebugWireframe = 4,
	DebugWireframeEnable = 5,
	Objects = 6,
	Eval = 69,
	Unknown = 255,
}

export type Message =
	| { type: MessageType.Log | MessageType.Eval | MessageType.TempButtonPress; message: string }
	| { type: MessageType.DebugWireframe; json: WireframeData }
	| { type: MessageType.DebugWireframeEnable; enabled: boolean }
	| { type: MessageType.SessionId; id: Uint8Array }
	| { type: MessageType.HiImNew }
	| { type: MessageType.Objects; resetAll?: boolean; objects: SceneObject[] }
	| { type: MessageType.Unknown; data: string | ArrayBuffer | Blob };

export type WireframeData = {
	circles: { x: number; y: number; r: number }[];
	vertices: [x: number, y: number][][];
};

export type SceneObject =
	| { id: number; removed: true }
	| { id: number; removed?: false; x: number; y: number; angle: number };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function concatBuffers(buffers: BufferSource[]): Uint8Array<ArrayBuffer> {
	const arr = new Uint8Array(buffers.reduce((cum, curr) => cum + curr.byteLength, 0));
	let offset = 0;
	for (const buffer of buffers) {
		if (buffer instanceof ArrayBuffer) {
			arr.set(new Uint8Array(buffer), offset);
		} else {
			arr.set(new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)), offset);
		}
		offset += buffer.byteLength;
	}
	return arr;
}

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
		case MessageType.DebugWireframe: {
			const encoded = encoder.encode(JSON.stringify(message.json));
			const arr = new Uint8Array(encoded.length + 1);
			arr.set(encoded, 1);
			arr[0] = message.type;
			return arr.buffer;
		}
		case MessageType.DebugWireframeEnable: {
			return new Uint8Array([message.type, +message.enabled]).buffer;
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
		case MessageType.Objects: {
			const parts: BufferSource[] = [new Uint8Array([message.type, +!!message.resetAll])];
			for (const object of message.objects) {
				// TODO: this is actually hella dumb, it would be better to just
				// segregate removed and new/updated lists probably
				if (object.removed) {
					const view = new DataView(new ArrayBuffer(2 + 2));
					view.setUint16(0, object.id);
					// 0x7ff8 is the first two bytes of a non-finite float (includes the
					// entire exponent)
					view.setUint16(2, 0x7ff8);
					parts.push(view);
				} else {
					const view = new DataView(new ArrayBuffer(2 + 8 * 3));
					view.setUint16(0, object.id);
					view.setFloat64(2, object.x);
					view.setFloat64(2 + 8, object.y);
					view.setFloat64(2 + 8 + 8, object.angle);
					parts.push(view);
				}
			}
			return concatBuffers(parts).buffer;
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
		case MessageType.DebugWireframe: {
			return { type, json: JSON.parse(decoder.decode(message.slice(1))) };
		}
		case MessageType.DebugWireframeEnable: {
			return { type, enabled: !!view.getUint8(1) };
		}
		case MessageType.SessionId: {
			return { type, id: new Uint8Array(message.slice(1)) };
		}
		case MessageType.HiImNew: {
			return { type };
		}
		case MessageType.Objects: {
			const objects: SceneObject[] = [];
			let offset = 2;
			while (offset + 2 <= message.byteLength) {
				const id = view.getUint16(offset);
				offset += 2;
				if (offset + 8 <= message.byteLength && Number.isFinite(view.getFloat64(offset))) {
					objects.push({
						id,
						removed: false,
						x: view.getFloat64(offset),
						y: view.getFloat64(offset + 8),
						angle: view.getFloat64(offset + 8 + 8),
					});
					offset += 8 * 3;
				} else {
					objects.push({ id, removed: true });
					offset += 2;
				}
			}
			return { type, resetAll: !!view.getInt8(1), objects };
		}
		default: {
			return { type: MessageType.Unknown, data: message };
		}
	}
}
