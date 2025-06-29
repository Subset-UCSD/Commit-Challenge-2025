import { mat4, quat, vec3 } from "gl-matrix";
import interpolate from "mat4-interpolate";

import { Vector3 } from "../../communism/types";

export type Interpolate<T> = (old: T, newValue: T, progress: number) => T;

export const interpolateMat4: Interpolate<mat4> = (old, newValue, prog) => {
	const out = mat4.create();
	interpolate(out, old, newValue, prog);
	return out;
};

export const lerp: Interpolate<number> = (old, newValue, prog) => {
	return (newValue - old) * prog + old;
};

export const interpolateVector3: Interpolate<Vector3> = (old, newValue, prog) => {
	return [lerp(old[0], newValue[0], prog), lerp(old[1], newValue[1], prog), lerp(old[2], newValue[2], prog)];
};

/** spherically linear interpolates (slerp) a direction vector */
export const slerpDirVec: Interpolate<Vector3> = (old, newValue, prog) => {
	// thanks chatgpt
	const start = quat.rotationTo(quat.create(), [0, 0, 1], old);
	const end = quat.rotationTo(quat.create(), [0, 0, 1], newValue);
	const [x, y, z] = vec3.transformQuat(vec3.create(), [0, 0, 1], quat.slerp(quat.create(), start, end, prog));
	return [x, y, z];
};

export type SetValueOptions = {
	duration: number
	delay: number
	now: number
}

export class Interpolator<T> {
	#old: T;
	#newValue: T;
	animationStart = 0;
	animationDuration = 0;
	#interpolate: Interpolate<T>;

	constructor(value: T, interpolate: Interpolate<T>) {
		this.#old = value;
		this.#newValue = value;
		this.#interpolate = interpolate;
	}

	getValue(now = Date.now()): T {
		if (this.animationDuration === 0) return this.#newValue;
		const progress = (now - this.animationStart) / this.animationDuration;
		if (progress >= 1) return this.#newValue;
		if (progress <= 0) return this.#old;
		return this.#interpolate(this.#old, this.#newValue, progress);
	}

	setValue(value: T, {duration = 0, delay = 0, now = Date.now()}:Partial<SetValueOptions>={}): void {
		this.#old = this.getValue(now);
		this.#newValue = value;
		this.animationStart = now + delay;
		this.animationDuration = duration;
	}
}
