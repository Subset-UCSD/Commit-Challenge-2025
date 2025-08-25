import * as phys from "cannon-es";
import { mat4, quat } from "gl-matrix";

import { NUM_SERVER_TICKS, SERVER_GAME_TICK } from "../../communism/constants";
import { EntityModel, ModelInstance } from "../../communism/messages";
import { MovementInfo, Vector3, YXZEuler } from "../../communism/types";
import { Game } from "../Game";
import { mats } from "../materials";
import { Entity } from "./Entity";
import { GrappleAnchorEntity } from "./GrappleAnchorEntity";

const CAPSULE_HEIGHT = 2;
const CAPSULE_RADIUS = 0.5;
const PLAYER_MASS = 10;

const WALK_SPEED = 13;
const SPRINT_SPEED = 22;
const JUMP_SPEED = 17;
const UPWARD_FRAMES = 0.2 * NUM_SERVER_TICKS;
const BOOST_RATIO = 3;
const COYOTE_FRAMES = 4;

// Maximum change in horizontal velocity that can be caused by the player while on the ground
const MAX_GROUND_SPEED_CHANGE = 3;
// Maximum change in horizontal velocity that can occur while in the air
const MAX_AIR_SPEED_CHANGE = 0.6;
// Indiscriminate cap on the velocity in the XY direction the player may have at the end of the move method
const MAX_GROUND_HORIZ_VEL = 20;
const MAX_AIR_HORIZ_VEL = 20;

export class PlayerEntity extends Entity {
	displayName = `Player ${this.id}`;

	private onGround = false;

	/**
	 * Whether the player is continuing to get acceleration upwards while holding
	 * down the jump button.
	 */
	private jumping = false;

	// movement
	private walkSpeed: number = WALK_SPEED;
	private initialSpeed: number = WALK_SPEED;
	private sprintSpeed: number = SPRINT_SPEED;
	private jumpSpeed: number = JUMP_SPEED;
	private maxGroundSpeedChange: number = MAX_GROUND_SPEED_CHANGE;
	private maxAirSpeedChange: number = MAX_AIR_SPEED_CHANGE;

	// shapes (the top sphere is the center of the entity)
	private cylinderHeight: number = CAPSULE_HEIGHT - 2 * CAPSULE_RADIUS;
	private capsuleRadius: number = CAPSULE_RADIUS;

	private sphereTop: phys.Sphere;
	private sphereBot: phys.Sphere;
	private cylinder: phys.Cylinder;
	/** The Y offset of the top of the entity. */
	private headOffset: number = this.capsuleRadius;
	/** The Y offset (should be negative) of the bottom of the entity. */
	private footOffset: number = -this.cylinderHeight - this.capsuleRadius;

	// coyote countdown
	private coyoteCounter: number = 0;
	private upwardCounter: number = 0;

	debugSpawnColliderPressed = false;
	debugGrapplePressed = false;

	constructor(game: Game, footPos: Vector3, model: EntityModel) {
		super(game, model);

		const pos = [footPos[0], footPos[1] - this.footOffset, footPos[2]];

		this.body = new phys.Body({
			mass: PLAYER_MASS,
			position: new phys.Vec3(...pos),
			fixedRotation: true,
			material: mats.player,
			collisionFilterGroup: this.getBitFlag(),
		});

		this.cylinder = new phys.Cylinder(this.capsuleRadius, this.capsuleRadius, this.cylinderHeight, 12);
		this.sphereTop = new phys.Sphere(this.capsuleRadius);
		this.sphereBot = new phys.Sphere(this.capsuleRadius);

		this.body.addShape(this.cylinder, new phys.Vec3(0, -this.cylinderHeight / 2, 0));
		this.body.addShape(this.sphereTop);
		this.body.addShape(this.sphereBot, new phys.Vec3(0, -this.cylinderHeight, 0));
	}

	checkOnGround(): boolean {
		const posFront = this.body.position.vadd(new phys.Vec3(this.capsuleRadius * 0.6, 0, 0));
		const posBack = this.body.position.vadd(new phys.Vec3(-this.capsuleRadius * 0.6, 0, 0));
		const posLeft = this.body.position.vadd(new phys.Vec3(0, 0, this.capsuleRadius * 0.6));
		const posRight = this.body.position.vadd(new phys.Vec3(0, 0, -this.capsuleRadius * 0.6));
		const offset = new phys.Vec3(0, this.cylinderHeight + this.capsuleRadius + Entity.EPSILON, 0);

		return (
			this.game.raycast(this.body.position, this.body.position.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posFront, posFront.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posBack, posBack.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posLeft, posLeft.vsub(offset), {}, this).length > 0 ||
			this.game.raycast(posRight, posRight.vsub(offset), {}, this).length > 0
		);
	}

	move(mvmt: MovementInfo): void {
		this.onGround = this.checkOnGround();

		if (this.upwardCounter > 0) this.coyoteCounter = 0;
		else if (this.onGround) this.coyoteCounter = COYOTE_FRAMES;
		else if (this.coyoteCounter > 0) this.coyoteCounter -= 1;

		const forwardVector = new phys.Vec3(-Math.sin(mvmt.lookDir.y), 0, -Math.cos(mvmt.lookDir.y));

		forwardVector.normalize();
		const rightVector = forwardVector.cross(new phys.Vec3(0, 1, 0));
		const currentVelocity = this.body.velocity;
		const maxChange = this.onGround ? this.maxGroundSpeedChange : this.maxAirSpeedChange;

		let targetVelocity = new phys.Vec3(0, 0, 0);
		if (mvmt.forward) {
			targetVelocity = targetVelocity.vadd(forwardVector);
		}
		if (mvmt.backward) {
			targetVelocity = targetVelocity.vadd(forwardVector.negate());
		}
		if (mvmt.right) {
			targetVelocity = targetVelocity.vadd(rightVector);
		}
		if (mvmt.left) {
			targetVelocity = targetVelocity.vadd(rightVector.negate());
		}
		if (targetVelocity.length() > 0) {
			targetVelocity.normalize();
		}
		targetVelocity = targetVelocity.scale(mvmt.sprint ? this.sprintSpeed : this.walkSpeed);

		let deltaVelocity = targetVelocity.vsub(currentVelocity.vmul(new phys.Vec3(1, 0, 1)));
		if (deltaVelocity.length() > maxChange) {
			deltaVelocity = deltaVelocity.scale(maxChange / deltaVelocity.length());
		}
		this.body.applyImpulse(deltaVelocity.scale(this.body.mass));

		if (mvmt.jump) {
			if (!this.jumping && this.coyoteCounter > 0) {
				this.jumping = true;
				const boost = deltaVelocity.clone();
				if (boost.length() > 0) boost.normalize();
				this.body.applyImpulse(boost.scale(this.body.mass).scale(BOOST_RATIO));
				this.upwardCounter = UPWARD_FRAMES;
			}
			if (this.upwardCounter > 0) {
				const deltaVy = new phys.Vec3(0, this.jumpSpeed, 0).vsub(currentVelocity.vmul(new phys.Vec3(0, 1, 0)));
				this.body.applyImpulse(deltaVy.scale(this.body.mass));
				this.upwardCounter -= 1;
			} else {
				this.jumping = false;
			}
		} else if (this.jumping) {
			this.jumping = false;
			this.upwardCounter = 0;
		}
		//console.log("BEFORE", this.body.velocity.x, this.body.velocity.y, this.body.velocity.z);
		// Scale velocity in xy direction to MAX_HORIZ_VEL
		let x = this.body.velocity.clone();
		x.y = 0;
		const max_vel = this.onGround ? MAX_GROUND_HORIZ_VEL : MAX_AIR_HORIZ_VEL;
		if (x.length() > max_vel) {
			x.normalize();
			x = x.vmul(new phys.Vec3(max_vel, max_vel, max_vel));
			x.y = this.body.velocity.y;
			this.body.velocity = x;
		}
		//console.log("AFTER", this.body.velocity.x, this.body.velocity.y, this.body.velocity.z);

		this.#spring?.applyForce();
	}

	setSpeed(speed: number) {
		this.walkSpeed = speed;
	}

	resetSpeed() {
		this.walkSpeed = this.initialSpeed;
	}

	#spring: phys.Spring | null = null;
	lastFoundAnchor: GrappleAnchorEntity | null = null;
	lastAnchor: GrappleAnchorEntity | null = null;
	findGrappleAnchor(lookDir: YXZEuler): GrappleAnchorEntity | null {
		const objects = this.game.raycast(
			this.body.position,
			new phys.Vec3(-Math.sin(lookDir.y), Math.sin(lookDir.x), -Math.cos(lookDir.y))
				.unit()
				.scale(100)
				.vadd(this.body.position),
			{},
			this,
		);
		const other = objects[0]?.entity;
		return other instanceof GrappleAnchorEntity ? other : null;
	}
	doGrapple(anchor: GrappleAnchorEntity | null) {
		if (anchor) {
			this.#spring = new phys.Spring(this.body, anchor.body, {
				restLength: 0,
				stiffness: 500,
				damping: 1,
			});
		} else {
			// disengage i think
			this.#spring = null;
		}
		this.lastAnchor = anchor;
	}

	serialize(): ModelInstance[] {
		const arr = super.serialize();
		if (this.lastAnchor) {
			const diff = this.body.position.clone().vsub(this.lastAnchor.body.position);
			arr.push({
				model: "models/anchor.glb",
				transform: Array.from(
					mat4.fromRotationTranslationScale(
						mat4.create(),
						quat.rotationTo(quat.create(), [0, 0, -1], diff.clone().unit().toArray()),
						this.body.position.clone().vadd(this.lastAnchor.body.position).scale(0.5).toArray(),
						[0.5, 0.5, diff.length()],
					),
				),
				interpolate: {
					id: `${this.id}-spring`,
					duration: SERVER_GAME_TICK,
				},
			});
		}
		return arr;
	}
}
