import * as phys from "cannon-es";

import { Vector3 } from "../../communism/types";
import { Game } from "../Game";
import { Entity } from "./Entity";

export class GrappleAnchorEntity extends Entity {
	constructor(game: Game, pos: Vector3) {
		super(game, "models/anchor.glb");

		this.body = new phys.Body({
			type: phys.Body.STATIC,
			position: new phys.Vec3(...pos),
			shape: new phys.Box(new phys.Vec3(0.5, 0.5, 0.5)),
			mass: 50,
		});
	}
}
