/**
 * @module
 * big ass file that is basically our graphics engine
 * tbh i dont really know what all this does
 */
// https://github.com/ucsd-cse125-sp24/group1/blob/main/client/render/engine/WebGlUtils.ts
// https://github.com/ucsd-cse125-sp24/group1/blob/main/client/render/engine/GraphicsEngine.ts#L18
// https://github.com/ucsd-cse125-sp24/group1/blob/main/client/render/engine/RenderPipeline.ts

import gltfVertShader from './😎/gltf.vert'
import gltfFragShader from './😎/gltf.frag'
import { ShaderProgram } from './ShaderProgram';

export type TextureType = "2d" | "cubemap";

export type Filter = {
	shader: ShaderProgram;
	/** Default: true */
	enabled?: boolean;
	/**
	 * Strength of the filter. Some filters may use this. If 0, the filter is
	 * skipped. Default: 1
	 */
	strength?: number;
};

type GateKeepMethods = 'activeTexture' | 'bindTexture' | 'createProgram' | 'createShader'
// these exist for convenience
class GlBase {
	/** ensure people use our `bindTexture` method */
  gl: Omit<WebGL2RenderingContext, GateKeepMethods>
  #gl: Pick<WebGL2RenderingContext, GateKeepMethods>
	
	#textures: Record<number, { type: TextureType; texture: WebGLTexture } | null> = {};

	imagePlanePositions: WebGLBuffer;
	imagePlaneTexCoords: WebGLBuffer;

	
	colorTexture: WebGLTexture;
	filteredTexture: WebGLTexture;
	depthTexture: WebGLTexture;

	constructor (gl: WebGL2RenderingContext) {
		this.gl = gl
		this.#gl = gl

		this.imagePlanePositions = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.imagePlanePositions);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
		this.imagePlaneTexCoords = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.imagePlaneTexCoords);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);

		this.colorTexture = gl.createTexture();
		this.bindTexture(0, "2d", this.colorTexture);
		// Disable mips
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.filteredTexture = gl.createTexture();
		this.bindTexture(0, "2d", this.filteredTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		this.depthTexture = gl.createTexture();
		this.bindTexture(0, "2d", this.depthTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}

	bindTexture(location: number, type: TextureType, texture: WebGLTexture | null): void {
		if (!Number.isInteger(location) || location < 0 || location > 31) {
			throw new RangeError(`${location} is not a valid texture unit. Only up to 32 texture units are supported.`);
		}
		const current = this.#textures[location];
		if ((current?.texture ?? null) === texture) {
			return;
		}
		this.#gl.activeTexture(this.gl.TEXTURE0 + location);
		if (current && current.type !== type) {
			// Avoid "Two textures of different types use the same sampler location."
			if (current.type === "2d") {
				this.#gl.bindTexture(this.gl.TEXTURE_2D, null);
			} else {
				this.#gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
			}
		}
		if (type === "2d") {
			this.#gl.bindTexture(this.gl.TEXTURE_2D, texture);
		} else {
			this.#gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, texture);
		}
		this.#textures[location] = texture ? { type, texture } : null;
	}

	clearTextures(): void {
		for (const [location, texture] of Object.entries(this.#textures)) {
			if (!texture) {
				continue;
			}
			this.#gl.activeTexture(this.gl.TEXTURE0 + +location);
			if (texture.type === "2d") {
				this.#gl.bindTexture(this.gl.TEXTURE_2D, null);
			} else {
				this.#gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);
			}
		}
		this.#textures = {};
	}

  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader, varNames: string[] = []): WebGLProgram {
		const gl = this.gl;
		const program = this.#gl.createProgram();
		if (program) {
			gl.attachShader(program, vertexShader);
			gl.attachShader(program, fragmentShader);
			if (varNames.length != 0) {
				gl.transformFeedbackVaryings(program, varNames, gl.SEPARATE_ATTRIBS);
			}
			gl.linkProgram(program);
			if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
				return program;
			}
			console.error(gl.getProgramInfoLog(program));
		}
		gl.deleteProgram(program);
		throw new Error("Failed to create program");
	}
	createShader(type: "vertex" | "fragment", source: string, name = "Untitled shader"): WebGLShader {
		const gl = this.gl;
		const shader = this.#gl.createShader(type === "vertex" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
		if (!shader) {
			throw new Error("Failed to create shader");
		}
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			return shader;
		}
		const infoLog = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new SyntaxError(`${name} failed to compile:\n${infoLog}`);
	}
}

export class Gl extends GlBase {
	// On Nick's computer on Firefox, it's 2048, but fish1 has a 4096x4096 texture
	maxTextureSize = this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE)

	// Replaces `#define` lines in shader files
	constants: Record<string, string> = {
		MAX_LIGHTS: `${+this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS) - 4}`,
		NEAR: "0.001",
		FAR: "100.0",
	};

	/** peepee (post-processing) effects */
	filters: Filter[] = []

	framebuffer = this.gl.createFramebuffer()

	gltfShader = new ShaderProgram(this, this.createProgram(
		this.createShader('vertex', gltfVertShader, 'gltf.vert'),
		this.createShader('fragment', gltfFragShader, 'gltf.frag'),
	))

	/**
	 * A helper method for compiling a shader. Useful for creating `Material`s.
	 *
	 * @param type The type of shader to compile for.
	 * @param source The GLSL code of the shader.
	 * @param name The name of the shader file. This is only used when the shader
	 * fails to compile, so it's helpful for debugging purposes to set this to
	 * @returns The compiled shader.
	 */
	createShader(type: "vertex" | "fragment", source: string, name = "Untitled shader :("): WebGLShader {
		for (const [name, value] of Object.entries(this.constants)) {
			source = source.replace(new RegExp(`#define ${name} .+`, "g"), `#define ${name} ${value}`);
		}
		return super.createShader(type, source, name)
	}

	clear(color: readonly [r: number, g: number, b: number] = [0, 0, 0]) {
		const gl = this.gl;
		gl.clearColor(...color, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	}

	/**
	 * By default, WebGL won't throw an error if you do something wrong. Instead,
	 * you have to manually ask WebGL if there have been any errors.
	 *
	 * If you think something is wrong, you can call this method after every WebGL
	 * call, and this will throw an error if something has gone wrong.
	 *
	 * Even then, the errors that WebGL gives aren't very specific or helpful.
	 * You'll get better quality error messages in the console when it happens.
	 * `checkError` is only good for halting the entire game when an error arises,
	 * which is helpful for debugging.
	 *
	 * However, this has a significant performance impact because it requires
	 * waiting on the GPU to finish drawing. You will have to trade off
	 * performance with knowing what line of code caused an issue. I recommend
	 * removing `checkError` calls after you're done debugging.
	 */
	checkError() {
		const error = this.gl.getError();
		// Error messages from MDN:
		// https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getError
		switch (error) {
			case this.gl.NO_ERROR:
				return;
			case this.gl.INVALID_ENUM:
				throw new TypeError("INVALID_ENUM: An unacceptable value has been specified for an enumerated argument.");
			case this.gl.INVALID_VALUE:
				throw new RangeError("INVALID_VALUE: A numeric argument is out of range.");
			case this.gl.INVALID_OPERATION:
				throw new TypeError("INVALID_OPERATION: The specified command is not allowed for the current state.");
			case this.gl.INVALID_FRAMEBUFFER_OPERATION:
				throw new Error(
					"INVALID_FRAMEBUFFER_OPERATION: The currently bound framebuffer is not framebuffer complete when trying to render to or to read from it.",
				);
			case this.gl.OUT_OF_MEMORY:
				throw new RangeError("OUT_OF_MEMORY: Not enough memory is left to execute the command.");
			case this.gl.CONTEXT_LOST_WEBGL:
				throw new Error("CONTEXT_LOST_WEBGL: The WebGL context is lost.");
		}
	}

	
	#textureWidth = 0;
	#textureHeight = 0;

	#resizeTextures(width: number, height: number): void {
		const gl = this.gl;
		this.bindTexture(0, "2d", this.colorTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		this.bindTexture(0, "2d", this.filteredTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
		this.bindTexture(0, "2d", this.depthTexture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT32F, width, height, 0, gl.DEPTH_COMPONENT, gl.FLOAT, null);
	}

	/** call before drawing the 3D shapes to the screen */
	beginRender(): void {
		const gl = this.gl;

		// Reallocate textures if canvas size has changed
		if (gl.canvas.width !== this.#textureWidth || gl.canvas.height !== this.#textureHeight) {
			this.#resizeTextures(gl.canvas.width, gl.canvas.height);
			this.#textureWidth = gl.canvas.width;
			this.#textureHeight = gl.canvas.height;
		}
		
		if (this.filters.length > 0) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);
		} else {
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		}
	}

	/** applies filters and then draws to the canvas for realz */
	applyFilters(): void {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		if (this.filters.length === 0) {
			return
		}
		// Use the framebuffer to apply each filter in succession, drawing from
		// colorTexture to filteredTexture then swapping the two textures
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, null, 0);
		for (const filter of this.filters.slice(0, -1)) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.filteredTexture, 0);
			this.#drawToPlane(filter);
			[this.colorTexture, this.filteredTexture] = [this.filteredTexture, this.colorTexture];
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		// Final draw to canvas
		this.#drawToPlane(this.filters[this.filters.length - 1]);
	}

	#drawToPlane({ shader, strength }: Filter): void {
		const gl = this.gl;
		this.clear();
		shader.use();
		// Set uniforms
		this.bindTexture(0, "2d", this.colorTexture);
		this.bindTexture(1, "2d", this.depthTexture);
		const { width, height } = this.gl.canvas;
		gl.uniform2f(shader.uniform("u_resolution"), width, height);
		gl.uniform1i(shader.uniform("u_texture_color"), 0);
		gl.uniform1i(shader.uniform("u_texture_depth"), 1);
		if (strength) {
			gl.uniform1f(shader.uniform("u_strength"), strength);
		}
		// Set up screen-filling plane
		const positionAttribLoc = shader.attrib("a_position");
		const texCoordAttribLoc = shader.attrib("a_texcoord");
		gl.enableVertexAttribArray(positionAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.imagePlanePositions);
		gl.vertexAttribPointer(positionAttribLoc, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.imagePlaneTexCoords);
		gl.vertexAttribPointer(texCoordAttribLoc, 2, gl.FLOAT, false, 0, 0);
		// Draw plane
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		// this.#engine._drawCalls++;
		// Clean up
		gl.disableVertexAttribArray(positionAttribLoc);
		gl.disableVertexAttribArray(texCoordAttribLoc);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		this.bindTexture(0, "2d", null);
		this.bindTexture(1, "2d", null);
	}
}
