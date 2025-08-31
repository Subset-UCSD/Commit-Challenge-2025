/**
 * 🎉 this is the main entry point of the frontend, analogous to Game.ts
 *
 * it is more like a script than a proper class, with global state etc., because it deals directly with the DOM
 *
 */

import "./index.css";

import { mat4, quat, vec3 } from "gl-matrix";

import { cameraTransform } from "../communism/cam";
import { SERVER_GAME_TICK } from "../communism/constants";
import {
	CameraMode,
	ClientMessage,
	ModelId,
	ModelInstance,
	SerializedBody,
	SerializedCollider,
	ServerMessage,
} from "../communism/messages";
import { Vector3, YXZEuler } from "../communism/types";
import { expect, fuck, shouldBeNever } from "../communism/utils";
import { listenToMovement } from "./cam-glam";
import { InputListener } from "./input";
import { interpolateMat4, interpolateVector3, Interpolator, lerp, slerpDirVec } from "./lib/Interpolator";
import { ModelManager } from "./lib/ModelManager";
import * as Vox from "./lib/Vox";
import { makeWs } from "./net";
import { Camera } from "./render/cam";
import { Gl } from "./render/Gl";

console.log("frontend!");

const canvas = document.getElementById("canvas") ?? expect("no canvas");

//#region temp chat
const ul = document.createElement("ul");
document.body.append(ul);

const f = document.getElementById("f");
if (f instanceof HTMLFormElement) {
	f.addEventListener("submit", (e) => {
		e.preventDefault();

		const thing = new FormData(f).get("message");
		if (typeof thing === "string") {
			send({ type: "chat", message: thing });
			f.reset();
		}
	});
}

const voiceChatBtn = document.getElementById("voice-chat-btn")!;
voiceChatBtn.addEventListener("click", () => {
	if (Vox.isActive()) {
		Vox.micOff();
		voiceChatBtn.textContent = "🎤 mic ON (again)";
	} else {
		Vox.micOn();
		voiceChatBtn.textContent = "🙊 speaknt";
	}
});

//#region state management
const modelManager = new ModelManager();

const instanceTransformInterpolators: Record<string, Interpolator<mat4>> = {};
const ambientLightColorInterpolator = new Interpolator<Vector3>([0, 0, 0], interpolateVector3);
const directionalLightDirectionInterpolator = new Interpolator<Vector3>([0, 1, 0], slerpDirVec);
const directionalLightColorInterpolator = new Interpolator<Vector3>([0, 0, 0], interpolateVector3);
/** for locked camera mode */
const cameraInterpolator = new Interpolator<mat4>(mat4.create(), interpolateMat4);
/** for client naive orbit camera mode */
let cameraAngle: YXZEuler = { y: 0, x: 0, z: 0 };
const cameraOrbitOrigin = new Interpolator<Vector3>([0, 0, 0], interpolateVector3);
const cameraOrbitRadius = new Interpolator(0, lerp);
const cameraOrbitRxRange = { min: -Math.PI / 2, max: Math.PI / 2 };
let cameraType: CameraMode["type"] = "locked";
// typescript hack :/
if (Math.random() < 0) {
	cameraType = "client-naive-orbit";
}

/**
 * slightly different than the one in messages.ts because it's preprocessed and deserialized for the renderer
 */
type ClientScene = {
	models: Map<ModelId, ModelInstance<true>[]>;
	pointLights: {
		position: number[];
		color: number[];
		falloff: number[];
	};
}[];
let scene: ClientScene = [];
let wireframeShit: SerializedBody[] = [];

//#region msg handler
const ID_KEY = "cave game user identifier";

/** may be called repeatedly */
const send = makeWs<ClientMessage, ServerMessage>("/fuck", {
	open: handleOpen,
	message: handleMessage,
	connectionStatus: handleConnectionStatus,
});
let lastHand = "";
export function handleOpen() {
	send({ type: "join", id: localStorage.getItem(ID_KEY) ?? "", name: "bruh" });
}
export function handleMessage(message: ServerMessage) {
	switch (message.type) {
		case "chat": {
			const li = document.createElement("li");
			li.style.whiteSpace = "pre-wrap";
			if (localStorage.getItem(ID_KEY) === message.user) {
				li.append(`<我> ${message.content}`);
			} else {
				li.append(`<${message.user.slice(0, 6)}> ${message.content}`);
			}
			ul.prepend(li);
			break;
		}
		case "chats": {
			const frag = document.createDocumentFragment();
			for (const content of message.contents) {
				const li = document.createElement("li");
				li.style.whiteSpace = "pre-wrap";
				li.append(content);
				frag.prepend(li);
			}
			ul.prepend(frag);
			break;
		}
		case "entire-state": {
			// preprocess (pp) scene so it doesn't need to be processed every frame
			scene = message.groups.map((group) => ({
				models: Map.groupBy(
					group.instances.map((inst) => ({
						...inst,
						transform: new Float32Array(inst.transform),
					})),
					(inst) => inst.model,
				),
				pointLights: {
					position: group.pointLights.flatMap((light) => light.position),
					color: group.pointLights.flatMap((light) => light.color),
					falloff: group.pointLights.map((light) => light.falloff),
				},
			}));

			// load any new models and update interpolators
			const now = Date.now();
			ambientLightColorInterpolator.setValue(message.globalLight.ambientColor, {
				...message.globalLight.ambientColorInterpolation,
				now,
			});
			directionalLightColorInterpolator.setValue(message.globalLight.directionColor, {
				...message.globalLight.directionColorInterpolation,
				now,
			});
			directionalLightDirectionInterpolator.setValue(message.globalLight.direction, {
				...message.globalLight.directionInterpolation,
				now,
			});
			cameraType = message.cameraMode.type;
			if (message.cameraMode.type === "locked") {
				cameraInterpolator.setValue(new Float32Array(message.cameraMode.cameraTransform), {
					...message.cameraMode.cameraTransformInterpolation,
					now,
				});
			} else if (message.cameraMode.type === "client-naive-orbit") {
				cameraOrbitOrigin.setValue(message.cameraMode.origin, { ...message.cameraMode.originInterpolation, now });
				cameraOrbitRadius.setValue(message.cameraMode.radius, { ...message.cameraMode.radiusInterpolation, now });
				cameraOrbitRxRange.min = message.cameraMode.minRx;
				cameraOrbitRxRange.max = message.cameraMode.maxRx;
			} else {
				console.error("what camera is this", message.cameraMode);
				shouldBeNever(message.cameraMode);
			}
			for (const group of scene) {
				for (const [modelPath, instances] of group.models) {
					modelManager.requestLoadModel(gl, modelPath);

					for (const instance of instances) {
						if (instance.interpolate) {
							const { id, duration, delay } = instance.interpolate;
							instanceTransformInterpolators[id] ??= new Interpolator(instance.transform, interpolateMat4);
							instanceTransformInterpolators[id].setValue(instance.transform, { duration, delay, now });
						}
					}
				}
			}

			const hand = message.debugGrappling ? "grapple" : message.debugSpawningBox ? "spawn-box" : "default";
			if (hand !== lastHand) {
				document.body.dataset.hand = hand;
				lastHand = hand;
			}

			Vox.updateVoicePositions(message.voices, message.voiceInterpolationDuration);

			wireframeShit = message.debugWireframeShit ?? [];

			break;
		}
		case "join-response": {
			localStorage.setItem(ID_KEY, message.privateId);
			const theIdIWant = crypto.randomUUID();
			Vox.yourVoiceConnId(theIdIWant).then(() => {
				send({ type: "i-wanna-join", connId: theIdIWant });
			});
			break;
		}
		case "set-client-naive-orbit-camera-angle": {
			cameraAngle = message.angle;
			break;
		}
		default: {
			console.error("fdsluihdif", message);
			shouldBeNever(message["type"]);
		}
	}
}

export function handleConnectionStatus(areWeConnected: boolean) {
	(document.querySelector("#f input") as fuck).disabled = !areWeConnected;
	(document.querySelector("#f button") as fuck).disabled = !areWeConnected;
}
handleConnectionStatus(false);

//#region input

const inputListener = new InputListener({
	default: {
		forward: false,
		backward: false,
		jump: false,
		left: false,
		right: false,
		debugSpawnBox: false,
		debugGrapple: false,
		sprint: false,
	},
	keymap: {
		KeyW: "forward",
		KeyA: "left",
		KeyS: "backward",
		KeyD: "right",
		Space: "jump",
		KeyO: "debugSpawnBox",
		KeyG: "debugGrapple",
		// I was going to do Shift or Control but that doesn't seem to work
		KeyC: "sprint",
	},
	handleInputs: (inputs) => {
		send({
			type: "client-input",
			...inputs,
		});
	},
	period: SERVER_GAME_TICK,
});
inputListener.listen();

let wireFrameMode: "hidden" | "with-depth" | "wo-depth" = "hidden";
if (Math.random() < 0) {
	wireFrameMode = "wo-depth"; // ts hack
}
document.addEventListener("keydown", (e) => {
	if (e.key === "m") {
		if (wireFrameMode === "hidden") {
			wireFrameMode = "with-depth";
			send({ type: "woggle-wire", yes: true });
		} else if (wireFrameMode === "with-depth") {
			wireFrameMode = "wo-depth";
		} else {
			wireFrameMode = "hidden";
			send({ type: "woggle-wire", yes: false });
		}
	}
});

/** How fast the camera rotates in degrees per pixel moved by the mouse */
const sensitivity = 0.4;
const { lockPointer, unlockPointer } = listenToMovement(canvas, (movementX, movementY, isTouch) => {
	cameraAngle.y -= (movementX * sensitivity * Math.PI) / 180;
	cameraAngle.x -= (movementY * sensitivity * Math.PI) / 180;
	if (cameraType === "client-naive-orbit") {
		if (cameraAngle.x < cameraOrbitRxRange.min) cameraAngle.x = cameraOrbitRxRange.min;
		if (cameraAngle.x > cameraOrbitRxRange.max) cameraAngle.x = cameraOrbitRxRange.max;
	}
	cameraAngle.y = ((cameraAngle.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
	send({ type: "client-naive-orbit-camera-angle", cameraAngle });
});

let lastPointerType = "mouse";
document.addEventListener("click", (e) => {
	if (lastPointerType === "touch") {
		inputListener.enabled = true;
		// NOTE: Currently, can't switch to touch after using mouse
	}
	lockPointer(lastPointerType === "touch");
});
document.addEventListener("pointerdown", (e) => {
	lastPointerType = e.pointerType;
});

//#region rendering
export const gl = new Gl(
	(canvas instanceof HTMLCanvasElement ? canvas : expect("#canvas")).getContext("webgl2") ?? expect("webgl context"),
);
gl.gl.enable(gl.gl.CULL_FACE);
gl.gl.enable(gl.gl.DEPTH_TEST);

function resize() {
	gl.gl.canvas.width = window.innerWidth;
	gl.gl.canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

const cam = new Camera();

const CLEAR_COLOR: Vector3 = [0.01, 0.02, 0.1];

//#region rendering: main game loop
while (true) {
	const now = Date.now();

	if (cameraType === "client-naive-orbit") {
		cam.transform = mat4.create();
		mat4.translate(cam.transform, cam.transform, cameraOrbitOrigin.getValue(now));
		mat4.multiply(cam.transform, cam.transform, cameraTransform(null, cameraAngle));
		mat4.translate(cam.transform, cam.transform, [0, 0, cameraOrbitRadius.getValue(now)]);
		// console.log(cam.transform)
	} else if (cameraType === "locked") {
		cam.transform = cameraInterpolator.getValue(now);
	}
	Vox.updateCameraAngle(cam.transform);
	const view = cam.pv(window.innerWidth / window.innerHeight);

	gl.clear(CLEAR_COLOR);
	gl.beginRender();

	gl.gltfShader.use();
	gl.gl.uniformMatrix4fv(gl.gltfShader.uniform("u_view"), false, view);
	gl.gl.uniform3f(gl.gltfShader.uniform("u_ambient_light"), ...ambientLightColorInterpolator.getValue(now));
	gl.gl.uniform3f(gl.gltfShader.uniform("u_dir_light_color"), ...directionalLightColorInterpolator.getValue(now));
	gl.gl.uniform3f(gl.gltfShader.uniform("u_dir_light_dir"), ...directionalLightDirectionInterpolator.getValue(now));
	gl.gl.uniform3fv(gl.gltfShader.uniform("u_eye_pos"), mat4.getTranslation(vec3.create(), cam.transform));

	for (const { models, pointLights } of scene) {
		gl.gl.uniform1i(gl.gltfShader.uniform("u_num_lights"), pointLights.falloff.length);
		if (pointLights.falloff.length > 0) {
			gl.gl.uniform3fv(gl.gltfShader.uniform("u_point_lights[0]"), pointLights.position);
			gl.gl.uniform3fv(gl.gltfShader.uniform("u_point_colors[0]"), pointLights.color);
			gl.gl.uniform1fv(gl.gltfShader.uniform("u_falloff[0]"), pointLights.falloff);
		}

		for (const [modelId, instances] of models) {
			const model = modelManager.needModelNOW(modelId);
			model?.draw(
				instances.map(({ interpolate, transform }) => ({
					transform: interpolate ? instanceTransformInterpolators[interpolate.id].getValue(now) : transform,
				})),
			);
		}
	}

	gl.applyFilters();

	// Draw wireframes
	if (wireframeShit.length > 0) {
		gl.wireframeShader.use();
		gl.gl.uniformMatrix4fv(gl.wireframeShader.uniform("u_view"), false, view);
		if (wireFrameMode === "wo-depth") {
			gl.gl.disable(gl.gl.DEPTH_TEST);
		}
		gl.gl.disable(gl.gl.CULL_FACE);
		for (const { position, quaternion, colliders } of wireframeShit) {
			const base = mat4.fromRotationTranslation(mat4.create(), quaternion, position);
			for (const collider of colliders) {
				gl.gl.uniformMatrix4fv(
					gl.wireframeShader.uniform("u_model"),
					false,
					mat4.multiply(
						mat4.create(),
						base,
						mat4.fromRotationTranslation(mat4.create(), collider.orientation, collider.offset),
					),
				);
				gl.drawWireframe(collider);
			}
		}
		gl.gl.enable(gl.gl.CULL_FACE);
		if (wireFrameMode === "wo-depth") {
			gl.gl.enable(gl.gl.DEPTH_TEST);
		}
	}

	await Promise.all([
		new Promise(window.requestAnimationFrame),
		new Promise((resolve) => {
			// die early if there's an error
			gl.checkError();
			resolve(0);
		}),
	]);
}
