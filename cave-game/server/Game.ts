/**
 * This manages the entire state of the game. Any gameplay specific elements
 * should be placed into this file or included into this file, and any interactions
 * that affect the state of the game must eventually be guaranteed to pass through
 * this class.
 *
 * This class serves as the ground source of truth for anything concerning the game
 */

import * as phys from "cannon-es";
import { Body } from "cannon-es";

import { SERVER_GAME_TICK } from "../communism/constants";
import { ClientMessage, ServerMessage } from "../communism/messages";
import { MovementInfo, Vector3 } from "../communism/types";
import { shouldBeNever } from "../communism/utils";
import { BoxEntity } from "./entities/BoxEntity";
import { Entity, EntityId } from "./entities/Entity";
import { PlaneEntity } from "./entities/PlaneEntity";
import { PlayerEntity } from "./entities/PlayerEntity";
import { PlayerInput } from "./net/PlayerInput";
import { Connection, Server, ServerHandlers } from "./net/Server";
import { WsServer } from "./net/WsServer";
import { PhysicsWorld } from "./PhysicsWorld";
import { GrappleAnchorEntity } from "./entities/GrappleAnchorEntity";

interface NetworkedPlayer {
	input: PlayerInput;
	entity: PlayerEntity | null;
	online: boolean;
	id: string;
	conn: Connection<ServerMessage>;
	name: string;
	debug: boolean;
}
type EntityRayCastResult = {
	entity: Entity;
	point: phys.Vec3;
	distance: number;
};

/**
 * canonically named George. see https://cse125.ucsd.edu/2024/cse125g1/w/2 for lore
 */
export class Game implements ServerHandlers<ClientMessage, ServerMessage> {
	// TEMP: gravity changed from -60. revert when floor is added
	private world = new PhysicsWorld({ gravity: [0, -70, 0] });
	private server: Server<ClientMessage, ServerMessage>;

	private players: Map<string, NetworkedPlayer>;
	private createdInputs: PlayerInput[];

	private entities: Map<EntityId, Entity>;
	private bodyToEntityMap: Map<Body, Entity>;

	private toCreateQueue: Entity[];
	private toDeleteQueue: EntityId[];

	private currentTick: number;

	constructor() {
		this.createdInputs = [];
		this.players = new Map();
		this.entities = new Map();
		this.bodyToEntityMap = new Map();

		this.toCreateQueue = [];
		this.toDeleteQueue = [];

		this.currentTick = 0;

		this.server = new WsServer(this);
		this.server.listen(8080);

		this.initWorld();
	}

	/**
	 * Temp function to put a plane floor into the world
	 */
	initWorld() {
		this.registerEntity(new PlaneEntity(this, "models/floor.glb", [0, -5, 0], [-1, 0, 0, 1]));
		this.registerEntity(new GrappleAnchorEntity(this, [10, 5, 10]));
		this.registerEntity(new GrappleAnchorEntity(this, [12, 10, 9]));
		this.registerEntity(new GrappleAnchorEntity(this, [-7, -3, -15]));
	}

	/**
	 * Checks for objects intersecting a line segment (*not* a ray) from `start`
	 * to `end`.
	 *
	 * IMPORTANT: `Ray.intersectWorld` does NOT return the closest object. Do not
	 * use it.
	 *
	 * @param exclude - Use to prevent players from including themselves in the
	 * raycast.
	 * @returns list of entities, closest first
	 */
	raycast(start: phys.Vec3, end: phys.Vec3, rayOptions: phys.RayOptions, exclude?: Entity): EntityRayCastResult[] {
		const entities: Record<EntityId, EntityRayCastResult> = {};
		for (const result of this.world.castRay(start, end, rayOptions)) {
			const entity = result.body && this.bodyToEntityMap.get(result.body);
			if (!entity) {
				console.log("who tf is this", result);
			}
			if (!entity || entity === exclude) {
				continue;
			}
			if (!entities[entity.id] || result.distance < entities[entity.id].distance) {
				entities[entity.id] = {
					entity,
					point: result.hitPointWorld,
					distance: result.distance,
				};
			}
		}
		return Object.values(entities).sort((a, b) => a.distance - b.distance);
	}

	getPlayerByEntityId = (id: EntityId) => this.players.values().find((p) => p.id === id);

	private createPlayerEntity(playerId: string, pos: Vector3 = [0, 0, 0]): PlayerEntity {
		let player = this.players.get(playerId);
		if (!player) {
			throw "Trying to create player entity, but player doesn't exist";
		}

		let entity = new PlayerEntity(this, [0, 0, 0], "./models/notacube.glb");
		player.entity = entity;
		return entity;
	}

	handlePlayerJoin(conn: Connection<ServerMessage>, name = `Player ${conn.id.slice(0, 6)}`) {
		let player = this.players.get(conn.id);
		if (player) {
			player.conn = conn;
			player.online = true;
		} else {
			let input = new PlayerInput();
			this.createdInputs.push(input);

			player = {
				id: conn.id,
				conn: conn,
				input: input,
				entity: null,
				online: true,
				name,
				debug: false,
			};
			this.players.set(conn.id, player);

			let entity = this.createPlayerEntity(conn.id);
			this.registerEntity(entity);
		}
	}
	handlePlayerDisconnect(id: string) {
		// TODO
	}

	/**
	 * Parses a raw websocket message, and then generates a response to the
	 * message if that is needed
	 * @param rawData the raw message data to process
	 * @param id A unique ID for the connection. Note that the same player may
	 * disconnect and reconnect, and this new connection will have a new ID.
	 * @returns a ServerMessage
	 */
	handleMessage(data: ClientMessage, conn: Connection<ServerMessage>): void {
		let player = this.players.get(conn.id);

		switch (data.type) {
			case "client-input": {
				player?.input?.updateInputs?.(data);
				break;
			}
			case "chat": {
				break;
			}
			case "join": {
				break;
			}
			case "client-naive-orbit-camera-angle": {
				player?.input.setLookDir(data.cameraAngle);
				break;
			}
			default:
				console.warn(`Unhandled message '${data["type"]}'`);
				shouldBeNever(data["type"]);
		}
	}

	getCurrentTick = () => this.currentTick;

	updateGameState() {
		for (let [id, player] of this.players.entries()) {
			if (!player.entity) {
				continue;
			}
			let inputs = player.input.getInputs();

			// Make dedicated movement information object to avoid letting the player entity
			let movement: MovementInfo = {
				...inputs,
				lookDir: player.input.getLookDir(),
			};

			player.entity.move(movement);

			if (player.entity.debugSpawnColliderPressed) {
				if (!inputs.debugSpawnBox) {
					player.entity.debugSpawnColliderPressed = false;
				}
			} else if (inputs.debugSpawnBox) {
				player.entity.debugSpawnColliderPressed = true;
				const dir = new phys.Vec3(
					-Math.sin(movement.lookDir.y),
					Math.sin(movement.lookDir.x) + 0.2,
					-Math.cos(movement.lookDir.y),
				);
				dir.normalize();
				const box = new BoxEntity(
					this,
					"./models/notacube_smooth.glb",
					dir
						.scale(1)
						.vadd(new phys.Vec3(...player.entity.getPos()))
						.toArray(),
					[1, 0, 0, 1],
					new phys.Vec3(1, 1, 1),
				);
				this.registerEntity(box);
				box.body.applyImpulse(dir.scale(40));
			}

			if (player.entity.debugGrapplePressed) {
				const anchor = player.entity.findGrappleAnchor(movement.lookDir);
				if (player.entity.lastFoundAnchor !== player.entity) {
					if (player.entity.lastFoundAnchor) player.entity.lastFoundAnchor.model = "models/anchor.glb";
				}

				if (!inputs.debugGrapple) {
					player.entity.debugGrapplePressed = false;
					player.entity.lastFoundAnchor = null;

					// spawn grapple on release
					if (player.entity.lastAnchor) {
						player.entity.lastAnchor.model = "models/anchor.glb";
					}
					player.entity.doGrapple(anchor);
					if (anchor) {
						anchor.model = "models/anchor-active.glb";
					}
				} else {
					if (anchor) anchor.model = "models/anchor-hover.glb";
					player.entity.lastFoundAnchor = anchor;
				}
			} else if (inputs.debugGrapple) {
				player.entity.debugGrapplePressed = true;
			}
		}
		this.nextTick();
	}

	private nextTick() {
		this.currentTick++;

		// Tick the world
		this.world.nextTick();

		// Tick the player inputs
		for (let input of this.createdInputs) {
			input.serverTick();
		}

		// Tick each of the entities
		for (let entity of this.entities.values()) {
			entity.tick();
		}

		// Run delete jobs
		if (this.toCreateQueue.length > 0 || this.toDeleteQueue.length > 0) {
			this.processEntityQueues();
		}
	}

	broadcastState() {
		//console.clear();
		for (const player of this.players.values()) {
			///console.log(player.entity?.getPos());
			player.conn.send({
				type: "entire-state",
				groups: [
					{
						instances: [
							...this.entities
								.values()
								.filter((entity) => !(player.entity?.debugGrapplePressed && player.entity === entity))
								.flatMap((entity) => entity.serialize()),
						],
						pointLights: [
							{
								position: [10, 2, 0],
								color: [0 / 360, 0.8, 0.5],
								falloff: 10,
							},
							{
								position: [-10, 2, 0],
								color: [180 / 360, 0.8, 0.5],
								falloff: 10,
							},
						],
					},
				],
				globalLight: {
					ambientColor: [0.5, 0.5, 0.5],
					direction: new phys.Vec3(Math.cos(Date.now() / 362), Math.sin(Date.now() / 362), 1).unit().toArray(),
					directionInterpolation: { duration: SERVER_GAME_TICK },
					directionColor: [2, 2, 2],
				},
				cameraMode: {
					// type: 'locked',
					// cameraTransform: Array.from(
					// 	cameraTransform([0, 20, 20], { y: 0, x: -Math.PI / 8 /* * (Math.sin(Date.now() / 847) + 1)*/, z: 0 }),
					// )
					type: "client-naive-orbit",
					minRx: player.entity?.debugGrapplePressed ? -Math.PI / 2 : -Math.PI / 3,
					maxRx: player.entity?.debugGrapplePressed ? Math.PI / 2 : Math.PI / 3,
					origin: player.entity?.getPos() ?? [0, 0, 0],
					originInterpolation: {
						duration: SERVER_GAME_TICK,
					},
					radius: player.entity?.debugGrapplePressed ? 0 : 10,
				},

				// cameraInterpolation: {duration:SERVER_GAME_TICK},
				// physicsBodies: player.debug ? this.world.serialize() : undefined,
				/*others: Array.from(this.players.values(), (p) =>
					p === player ? [] : [this.serializeNetworkedPlayer(p)],
				).flat(),
				me: this.serializeNetworkedPlayer(player),*/
			});
		}
	}

	addToDeleteQueue(sussyAndRemovable: EntityId) {
		const index = this.toCreateQueue.findIndex((entity) => entity.id === sussyAndRemovable);
		if (index !== -1) {
			this.toCreateQueue.splice(index, 1);
			return;
		}

		this.toDeleteQueue.push(sussyAndRemovable);
	}

	addToCreateQueue(entity: Entity) {
		// If entity was in delete queue, remove it from there instead (can happen
		// if an entity is deleted then re-added in the same tick)
		const index = this.toDeleteQueue.indexOf(entity.id);
		if (index !== -1) {
			this.toDeleteQueue.splice(index, 1);
			return;
		}

		this.toCreateQueue.push(entity);
	}

	processEntityQueues() {
		for (const entity of this.toCreateQueue) {
			this.entities.set(entity.id, entity);
			this.bodyToEntityMap.set(entity.body, entity);
			entity.addToWorld(this.world);
		}
		this.toCreateQueue = [];

		for (const entityId of this.toDeleteQueue) {
			let entity = this.entities.get(entityId);

			console.log("delete", entityId);

			if (entity) {
				this.bodyToEntityMap.delete(entity.body);
				this.entities.delete(entity.id);
				entity.removeFromWorld(this.world);
			} else {
				console.log("Bug Detected! Tried to delete an entity that didn't exist");
			}
		}
		this.toDeleteQueue = [];
	}

	/**
	 * Registers an entity in the physics world and in the game state
	 * so that it can be interacted with. Unregistered entities do not
	 * affect the game in any way
	 * @param entity the constructed entity to register
	 *
	 * NOTE: After the world has been created, use `addToCreateQueue` to avoid
	 * issues while creating or removing entities during a tick.
	 */
	private registerEntity(entity: Entity) {
		this.entities.set(entity.id, entity);
		this.bodyToEntityMap.set(entity.body, entity);

		// this is one way to implement collision that uses bodyToEntityMap without passing Game reference to entities
		entity.body.addEventListener(Body.COLLIDE_EVENT_NAME, (params: { body: Body; contact: any }) => {
			const otherBody: Body = params.body;
			const otherEntity: Entity | undefined = this.bodyToEntityMap.get(otherBody);
			if (otherEntity) entity.onCollide(otherEntity);
		});

		entity.addToWorld(this.world);
	}

	/**
	 * NOTE: After the world has been created, use `addToDeleteQueue` to avoid
	 * issues while creating or removing entities during a tick.
	 */
	private unregisterEntity(entity: Entity) {
		this.entities.delete(entity.id);
		this.bodyToEntityMap.delete(entity.body);
		entity.removeFromWorld(this.world);
	}

	/**
	 * resolved once a player joins. becomes a new `Promise` object when all players leave
	 *
	 * used to pause the game when no one is online so (a) objects dont fall infinitely (there's no floor rn)
	 * and (b) to conserve resources. we love the environment
	 */
	get hasPlayers() {
		return this.server.hasConnection;
	}
}
