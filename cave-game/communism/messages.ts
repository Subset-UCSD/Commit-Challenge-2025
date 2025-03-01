import { EntityId } from "../rear-end/entities/Entity";
import { Quaternion, Vector2, Vector3 } from "./types";

export type ServerModel = {
	id: EntityId;
	/** url of .glb; also serves as ID for model */
	model: ModelId;
	/** 4x4 matrix (gl-matrix `mat4`) */
	transform: Quaternion;
	position: Vector3;
	/**
	 * defines a transition animation between previous and new transform. inspired
	 * by minecraft block display interpolation: https://youtu.be/8MPDyaYBUnM?t=64
	 */
	interpolate?: {
		/** delay after receiving object to begin interpolation, in milliseconds. defaults to 0, starting immediately */
		delay?: number;
		/** length of transition animation in milliseconds */
		duration: number;
	};
};

export type ServerMessage =
	| { type: "chats"; contents: string[] }
	| { type: "chat"; user: string; content: string }
	| { type: "you are"; id: number }
	| {
			type: "entire-state";
			objects: ServerModel[];
	  }
	| {
			type: "join-response";
			id: string;
	  };

export type ClientMessage =
	| { type: "chat"; message: string }
	| {
			/**
			 * this event is sent whenever a key is PRESSED DOWN or LIFTED
			 * however.. it is not sent when the page first loads and no keys are pressed
			 * !
			 */
			type: "key-state-update";
			/**
			 * A list of keys that are being held down
			 *
			 * these are physical keys from `KeyEvent.code`
			 * documentation of values: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
			 * for example: `KeyW` `ShiftLeft` `ArrowUp`
			 * physical keys, so on AZERTY keyboard A key would be KeyQ
			 *
			 * known issue: modifier keys can be weird
			 * press left shift -> hold right shift -> lift left shift. right shift will remain down
			 */
			keys: string[];
	  }
	| ClientInputMessage
	| {
			type: "join";
			id?: string;
			name: string;
	  };
export type ClientInputMessage = {
	type: "client-input";
} & ClientInputs;

// TODO, make a model system that incorporates TYPES
export type EntityModel = string;
export type ModelId = string;

export type SerializedBody = {
	quaternion: Quaternion;
	position: Vector3;
	colliders: SerializedCollider[];
};
export type SerializedColliderBase = BoxCollider | PlaneCollider | SquareCollider | SphereCollider | CylinderCollider;
export type SerializedCollider = SerializedColliderBase & {
	offset: Vector3;
	orientation: Quaternion;
};
export type PlaneCollider = {
	type: "plane";
};
/**
 * Represents a finite plane with side length 2. By default, it represents a
 * flat square with side lengths `2 * size` on the xy-plane, so its vertices are
 * between `(-x, -y, 0)` and `(x, y, 0)`.
 */
export type SquareCollider = {
	type: "square";
	size: Vector2;
};
/**
 * Represents a box. By default, it is a box with side lengths `2 * size`
 * centered about the origin, so its vertices are between `(-x, -y, -z)` and
 * `(x, y, z)`.
 */
export type BoxCollider = {
	type: "box";
	size: Vector3;
};
export type SphereCollider = {
	type: "sphere";
	radius: number;
};
export type CylinderCollider = {
	type: "cylinder";
	radiusTop: number;
	radiusBottom: number;
	height: number;
	numSegments: number;
};

export type ClientInputs = {
	forward: boolean;
	backward: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
	lookDir: Vector3;
};
export type PlayerEntry = {
	name: string;
	entityId?: EntityId;
	online: boolean;
};
