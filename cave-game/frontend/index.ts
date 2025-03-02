/**
 * 🎉 this is the main entry point of the frontend, analogous to Game.ts
 *
 * it is more like a script than a proper class, with global state etc., because it deals directly with the DOM
 *
 */

import "./index.css";

import { mat4 } from "gl-matrix";

import { SERVER_GAME_TICK } from "../communism/constants";
import { GlobalLight, ModelId, ModelInstance, ServerMessage } from "../communism/messages";
import { Vector3 } from "../communism/types";
import { expect, FUCK } from "../communism/utils";
import { InputListener } from "./input";
import { interpolateMat4, Interpolator } from "./lib/Interpolator";
import { ModelManager } from "./lib/ModelManager";
import { send } from "./net";
import { Camera } from "./render/cam";
import { Gl } from "./render/Gl";

console.log("frontend!");

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

//#region server message handling
const modelManager = new ModelManager();

const instanceTransformInterpolators: Record<string, Interpolator<mat4>> = {};

/**
 * slightly different than the one in messages.ts because it's preprocessed and deserialized for the renderer
 */
type ClientScene = {
	groups: {
		models: Map<ModelId, ModelInstance<true>[]>;
		pointLights: {
			position: number[];
			color: number[];
			falloff: number[];
		};
	}[];
	globalLight: GlobalLight;
};
let scene: ClientScene = {
	globalLight: {
		ambientColor: [0.5, 0.5, 0.5],
		direction: [0, -1, 0],
		directionColor: [1, 1, 1],
	},
	groups: [],
};

//#region ACTUAL	msg handler
const ID_KEY = "cave game user identifier";

/** may be called repeatedly */
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
		case "you are": {
			break;
		}
		case "entire-state": {
			// preprocess (pp) scene so it doesn't need to be processed every frame
			scene = {
				globalLight: message.globalLight,
				groups: message.groups.map((group) => ({
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
				})),
			};

			// load any new models and update interpolators
			const now = Date.now();
			for (const group of scene.groups) {
				for (const [modelPath, instances] of group.models) {
					modelManager.requestLoadModel(gl, modelPath);

					for (const instance of instances) {
						if (instance.interpolate) {
							const { id, duration, delay } = instance.interpolate;
							instanceTransformInterpolators[id] ??= new Interpolator(instance.transform, interpolateMat4);
							instanceTransformInterpolators[id].setValue(instance.transform, duration, delay, now);
						}
					}
				}
			}
			break;
		}
		case "join-response": {
			localStorage.setItem(ID_KEY, message.id);
			break;
		}
		default: {
			console.error("fdsluihdif", message);
		}
	}
}

export function handleConnectionStatus(areWeConnected: boolean) {
	(document.querySelector("#f input") as FUCK).disabled = !areWeConnected;
	(document.querySelector("#f button") as FUCK).disabled = !areWeConnected;
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
	},
	keymap: {
		KeyW: "forward",
		KeyA: "left",
		KeyS: "backward",
		KeyD: "right",
		Space: "jump",
	},
	handleInputs: (inputs) => {
		const [x, y, z] = [0, 0, 0]; //camera.getForwardDir();
		send({
			type: "client-input",
			...inputs,
			lookDir: [x, y, z],
		});
	},
	period: SERVER_GAME_TICK,
});

//#region rendering
const canvas = document.getElementById("canvas");
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
cam.position[2] = 20; // (Math.sin(now / 1248) + 1) * (25-3)/2 + 3
cam.position[1] = 20;
cam.rotation.x = -Math.PI / 8;
// cam.rotation.y = Math.PI

const CLEAR_COLOR: Vector3 = [0.01, 0.02, 0.1];

//#region rendering: main game loop
while (true) {
	const now = Date.now();

	const view = cam.pv(window.innerWidth / window.innerHeight);

	gl.clear(CLEAR_COLOR);
	gl.beginRender();

	gl.gltfShader.use();
	gl.gl.uniformMatrix4fv(gl.gltfShader.uniform("u_view"), false, view);
	gl.gl.uniform3f(gl.gltfShader.uniform("u_ambient_light"), ...scene.globalLight.ambientColor);
	gl.gl.uniform3f(gl.gltfShader.uniform("u_dir_light_color"), ...scene.globalLight.directionColor);
	gl.gl.uniform3f(gl.gltfShader.uniform("u_dir_light_dir"), ...scene.globalLight.direction);
	gl.gl.uniform3fv(gl.gltfShader.uniform("u_eye_pos"), cam.position);

	for (const { models, pointLights } of scene.groups) {
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

	await Promise.all([
		new Promise(window.requestAnimationFrame),
		new Promise((resolve) => {
			// die early if there's an error
			gl.checkError();
			resolve(0);
		}),
	]);
}
