import * as phys from "cannon-es";
import { Game } from "../Game";
import { Entity } from "./Entity";
import { EntityModel } from "../../communism/messages";
import { Vector3, Quaternion } from "../../communism/types";
import { mats } from "../materials";

export class PlaneEntity extends Entity {

	constructor(game: Game, model: EntityModel, pos: Vector3, rotation: Quaternion) {
		super(game, model);
		this.model = model;

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			quaternion: new phys.Quaternion(...rotation).normalize(),
			fixedRotation: true,
			material: mats.ground,
			shape: new phys.Plane()
		});
	}
}
