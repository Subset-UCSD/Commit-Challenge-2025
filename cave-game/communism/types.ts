export type Vector2 = [x: number, y: number];
export type Vector3 = [x: number, y: number, z: number];
export type Vector4 = [r: number, g: number, b: number, a: number];
export type Quaternion = [x: number, y: number, z: number, w: number];

export type MovementInfo = {
	lookDir: YXZEuler;
} & ClientInputs;

export type ClientInputs = {
	forward: boolean;
	backward: boolean;
	right: boolean;
	left: boolean;
	jump: boolean;
	sprint: boolean;
	debugSpawnBox: boolean;
};
/**
 * the first two are pitch and yaw but tbh i never remember which is which.
 * this is why i dont fly planes. it's easier to remember it as rotating
 * around axes tho
 *
 * roll is rotating around z and it's like tilting your head side to side
 */
export type YXZEuler = {
	/** head shake, left/right */
	y: number;
	/** head nod, up/down */
	x: number;
	/** head tilt, "roll" */
	z: number;
};
