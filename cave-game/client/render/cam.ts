import { mat4, vec3 } from "gl-matrix";

export class Camera {
	transform = mat4.create();
	upDir = vec3.fromValues(0, 1, 0);
	/** based on screen height not width */
	fov = Math.PI / 3;
	near = 0.01;
	far = 100;

	/**
	 * @param aspectRatio screen width / height
	 * @returns projection * view matrix
	 */
	pv(aspectRatio: number): mat4 {
		const view = mat4.invert(mat4.create(), this.transform) ?? mat4.create();
		const perspective = mat4.perspective(mat4.create(), this.fov, aspectRatio, this.near, this.far);
		return mat4.multiply(mat4.create(), perspective, view);
	}
}
