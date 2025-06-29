import { mat4 } from "gl-matrix";

import { EntityId } from "../server/entities/Entity";
import { ClientInputs, Quaternion, Vector2, Vector3, YXZEuler } from "./types";

export type InterpolationSettings = {
	/** delay after receiving object to begin interpolation, in milliseconds. defaults to 0, starting immediately */
	delay?: number;
	/** length of transition animation in milliseconds */
	duration: number;
};

/**
 * the client can only support ONE directional light, and it is GLOBAL. it will cast shadows
 *
 * in the future I plan on adding support for interpolation for direction and color for some cool transitions between rooms
 */
export type GlobalLight = {
	/** color of ambient light. RGB, 0 to 1 */
	ambientColor: Vector3;
	ambientColorInterpolation?: InterpolationSettings;
	/** direction of directional light. NORMALIZED vector */
	direction: Vector3;
	directionInterpolation?: InterpolationSettings;
	/** color of directional light. RGB, 0 to 1 (but you can go above 1 for brighter colors) */
	directionColor: Vector3;
	directionColorInterpolation?: InterpolationSettings;
};

/**
 * point lights are per group. they do not cast shadows. models can have a good number of point lights, probably (performance testing needed). like around 32
 *
 * per-model/group point lights allow for supporting a lot of lights in the entire world, by having lights defined per room. however, limiting lights to rooms is an arbitary restriction that is up to how the lights are modelled on the server side; the client only needs to know what lights to consider for each model
 *
 * in other words, it's up to the server how to model a "room." the client doesn't care; all it needs to know is what models to render and what lights these models need to ocnsider
 */
export type PointLight = {
	/** global position of the light. does not account for the model instance's transformation */
	position: Vector3;
	/** HSV, 0 to 1. though value, which controls the brightness of the light, can be more than 1 for a brighter light */
	color: [hue: number, saturation: number, value: number];
	/**
	 * the range of the light
	 *
	 * the bigger the better because it looks nicer. also means you don't need to make the light as bright to make it visible, so it reduces overexposed white spots
	 *
	 *
	 * having a large falloff does not impact performance.
	 * however, if the falloff is too big, it may touch more model instances, and thus more of them may need to consider this point light when rendering
	 *
	 */
	falloff: number;
};

/**
 * an instance of a model
 *
 * allows the server to define what objects to render on the client
 *
 * if/when animation support is added, animation state will be included in this object
 */
export type ModelInstance<OnClient = false> = {
	/**
	 * url of .glb; also serves as ID for model (to batch draw calls and cache model data).
	 * the client will use this path to fetch the model data
	 */
	model: ModelId;
	/** 4x4 matrix (gl-matrix `mat4`) */
	transform: OnClient extends true ? mat4 : number[];
	/**
	 * defines a transition animation between previous and new transform. inspired
	 * by minecraft block display interpolation: https://youtu.be/8MPDyaYBUnM?t=64
	 */
	interpolate?: InterpolationSettings & {
		/**
		 * globally unique ID used to look up the previous state for interpolation
		 *
		 * NOTE: the client does not enforce that it is unique
		 */
		id: string;
	};
};

/**
 * a model group is like a room, but not exactly:
 *
 * - a group is a set of model instances that share the same point lights
 * - a room is a server-side construct that defines the building blocks of the cave in the game
 *
 * so a large room might be broken into multiple groups for performance reasons,
 * or one group could contain the model instances of several rooms
 *
 * why groups? for performance, we can combine draw calls for instances of the same model, but we can't combine them if they have different lights that apply to them. so this makes it easier for the client to know which instances to batch together
 */
export type ModelGroup = {
	// /** similar to `ModelInstance.id`, this is also used for interpolation */
	// id: string
	instances: ModelInstance[];
	pointLights: PointLight[];
};

export type Scene = {
	/** see `ModelGroup` docs for what a group is */
	groups: ModelGroup[];
	globalLight: GlobalLight;
	cameraMode: CameraMode;
};

export type CameraMode =
	| {
			/** hand camera control to server side for more control */
			type: "locked";
			cameraTransform: number[];
			cameraTransformInterpolation?: InterpolationSettings;
	  }
	| {
			/** let client naively orbit around a point. smoother but probably a premature optimization */
			type: "client-naive-orbit";
			origin: Vector3;
			originInterpolation?: InterpolationSettings;
			/** radius of 0 should feel like first person */
			radius: number;
			radiusInterpolation?: InterpolationSettings;
			minRx: number;
			maxRx: number;
	  };

export type ServerMessage =
	| { type: "chats"; contents: string[] }
	| { type: "chat"; user: string; content: string }
	| ({
			/**
			 * allows the server to define what to render on the client
			 *
			 * intentionally low level so that people working on the server can avoid touching client code
			 */
			type: "entire-state";
	  } & Scene)
	| {
			type: "set-client-naive-orbit-camera-angle";
			angle: YXZEuler;
	  }
	| {
			type: "join-response";
			id: string;
	  };

export type ClientMessage =
	| { type: "chat"; message: string }
	| ClientInputMessage
	| {
			type: "client-naive-orbit-camera-angle";
			cameraAngle: YXZEuler;
	  }
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

export type PlayerEntry = {
	name: string;
	entityId?: EntityId;
	online: boolean;
};
