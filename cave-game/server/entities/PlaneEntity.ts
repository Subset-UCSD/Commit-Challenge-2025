import * as phys from "cannon-es";
import { mat4 } from "gl-matrix";

import { ModelInstance } from "../../communism/messages";
import { Vector3 } from "../../communism/types";
import { Game } from "../Game";
import { mats } from "../materials";
import { Entity } from "./Entity";

export class PlaneEntity extends Entity {
	constructor(game: Game, pos: Vector3) {
		super(game, "models/floor.glb");

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			quaternion: new phys.Quaternion(-1, 0, 0, 1).normalize(),
			fixedRotation: true,
			material: mats.ground,
			shape: new phys.Plane(),
		});
	}

	serialize(): ModelInstance[] {
		const [plane] = super.serialize();
		const [x, y, z] = this.getPos();
		return [
			{
				...plane,
				transform: Array.from(
					mat4.fromRotationTranslation(
						mat4.create(),
						// quat.create(),
						// quat.fromEuler(quat.create(), 0, Math.PI / 2, 0),
						[-Math.SQRT1_2, 0, 0, Math.SQRT1_2],
						[x, y - 0.4, z],
					),
				),
			},
		];
	}
}
