import * as phys from "cannon-es";
import { Body, World } from "cannon-es";

import { SERVER_GAME_TICK } from "../communism/constants";
import { SerializedBody } from "../communism/messages";
import { serializeShape } from "./lib/serializeShape";

type WorldSetup = {
	gravity: [number, number, number];
};

export function v3(a: number, b: number, c: number) {
	return new phys.Vec3(a, b, c);
}
export function q4(x: number, y: number, z: number, w: number) {
	return new phys.Quaternion(x, y, z, w);
}

/**
 * A properties-only, non-class version of `phys.RaycastResult` because Cannon
 * writes into the same result object while it raycasts.
 */
export type RaycastResult = Omit<phys.RaycastResult, "reset" | "abort" | "set">;

export class PhysicsWorld {
	#world: phys.World;
	#colliders: phys.Body[];

	constructor(setup: WorldSetup) {
		this.#world = new World({
			gravity: v3(...setup.gravity),
		});
		this.#colliders = [];
	}

	addBody(body: Body) {
		this.#world.addBody(body);
		this.#colliders.push(body);
	}
	removeBody(body: Body) {
		this.#world.removeBody(body);
		this.#colliders.splice(this.#colliders.indexOf(body), 1);
	}

	removeAllBodies() {
		for (let collider of this.#colliders) {
			this.#world.removeBody(collider);
		}
	}

	#time = 0;
	nextTick() {
		this.#world.step(1 / SERVER_GAME_TICK);
		this.#time += SERVER_GAME_TICK;
	}

	castRay(from: phys.Vec3, to: phys.Vec3, rayOptions: phys.RayOptions): RaycastResult[] {
		const results: RaycastResult[] = [];
		this.#world.raycastAll(from, to, rayOptions, (result) => {
			// Need to clone result because the physics engine will continue to modify it
			results.push({ ...result, hitPointWorld: result.hitPointWorld.clone() });
		});
		return results;
	}

	/**
	 * Serialize every body and collider in the physics engine to draw as
	 * wireframes for debug purposes.
	 *
	 * IMPORTANT: Do not use any instance variables like `this.#colliders`, which
	 * are copies of physics state and may get out of sync. This function MUST
	 * call directly to the physics engine, or this can hide desync issues that
	 * will make debugging a nightmare.
	 */
	serialize(): SerializedBody[] {
		return this.#world.bodies.map((body) => ({
			position: body.position.toArray(),
			quaternion: body.quaternion.toArray(),
			colliders: body.shapes.map((shape, i) => ({
				...serializeShape(shape),
				offset: body.shapeOffsets[i].toArray(),
				orientation: body.shapeOrientations[i].toArray(),
			})),
		}));
	}
}
