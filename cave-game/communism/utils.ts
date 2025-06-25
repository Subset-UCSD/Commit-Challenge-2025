import type { mat4, vec3 } from "gl-matrix";

export function expect(message: string): never {
	throw new TypeError(`expected ${message}`);
}

export function mergeVec3(vecs: vec3[]): Float32Array {
	const arr = new Float32Array(vecs.length * 3);
	for (let i = 0; i < vecs.length; i++) {
		arr.set(vecs[i], i * 3);
	}
	return arr;
}

export function mergeMatrices(matrices: mat4[]): Float32Array {
	const arr = new Float32Array(matrices.length * 16);
	for (let i = 0; i < matrices.length; i++) {
		arr.set(matrices[i], i * 16);
	}
	return arr;
}

export function f32ArrayEqual(a: Float32Array, b: Float32Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
}

export type FUCK = any;
export type fuck = any;

/**
 * promise version of `setTimeout`. returns a promise that resolves in `time` milliseconds
 *
 * @param time - Delay in milliseconds
 *
 * @example
 * await sleep(1000) // wait a sec
 */
export async function sleep(time: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, time));
}

export function shouldBeNever(_: never): void {}
