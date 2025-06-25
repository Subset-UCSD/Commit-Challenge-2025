/**
 * helper functions for constructing a transformation matrix from a camera
 * position and its rotation
 */

import type * as phys from "cannon-es";
import { mat4, vec3 } from "gl-matrix";

import { Vector3 } from "./types";

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

/**
 * cannon-es/gl-matrix agnostic utility function that constructs a transformation matrix from a camera's position and roation
 *
 * also helpful for converting euler angles to matrix
 */
export function cameraTransform(
	position: vec3 | phys.Vec3 | Vector3 | null,
	rotation: YXZEuler | phys.Quaternion | null,
): mat4 {
	const cameraTransform = mat4.create();
	if (position) {
		if ("x" in position) {
			position = [position.x, position.y, position.z];
		}
		mat4.translate(cameraTransform, cameraTransform, position);
	}
	if (rotation) {
		if ("w" in rotation) {
			// untested
			mat4.multiply(cameraTransform, cameraTransform, mat4.fromQuat(mat4.create(), rotation.toArray()));
		} else {
			mat4.rotateY(cameraTransform, cameraTransform, rotation.y);
			mat4.rotateX(cameraTransform, cameraTransform, rotation.x);
			mat4.rotateZ(cameraTransform, cameraTransform, rotation.z);
		}
	}
	return cameraTransform;
}
