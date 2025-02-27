import { Gl } from "./Gl";

/**
 * A material represents a shader program.
 */
export class ShaderProgram {
	engine: Gl;
	#program: WebGLProgram;
	#uniformLocations: Record<string, WebGLUniformLocation | null> = {};
	#attribLocations: Record<string, number> = {};

	constructor(engine: Gl, program: WebGLProgram) {
		this.engine = engine;
		this.#program = program;
	}

	get _debugProgram(): WebGLProgram {
		return this.#program;
	}

	set _debugProgram(program: WebGLProgram) {
		this.#program = program;
		this.#uniformLocations = {};
		this.#attribLocations = {};
	}

	use() {
		this.engine.gl.useProgram(this.#program);
	}

	uniform(name: string): WebGLUniformLocation | null {
		if (this.#uniformLocations[name] === undefined) {
			this.#uniformLocations[name] = this.engine.gl.getUniformLocation(this.#program, name);
		}
		return this.#uniformLocations[name];
	}

	setUniforms(
		materialProps: { ambient: number[]; diffuse: number[]; specular: number[]; shininess: number },
		lightProps: { ambient: number[]; diffuse: number[]; specular: number[]; position: number[] },
	) {
		this.use(); // Make sure the program is being used before setting uniforms

		// Set material properties
		this.engine.gl.uniform3fv(this.uniform("uAmbient"), materialProps.ambient);
		this.engine.gl.uniform3fv(this.uniform("uDiffuse"), materialProps.diffuse);
		this.engine.gl.uniform3fv(this.uniform("uSpecular"), materialProps.specular);
		this.engine.gl.uniform1f(this.uniform("uShininess"), materialProps.shininess);

		// Set light properties
		this.engine.gl.uniform3fv(this.uniform("uLightAmbient"), lightProps.ambient);
		this.engine.gl.uniform3fv(this.uniform("uLightDiffuse"), lightProps.diffuse);
		this.engine.gl.uniform3fv(this.uniform("uLightSpecular"), lightProps.specular);
		this.engine.gl.uniform3fv(this.uniform("uLightPosition"), lightProps.position);
	}

	attrib(name: string): number {
		const location = this.attribMaybe(name);
		if (location === null) {
			throw new ReferenceError(`Attribute ${name} not found`);
		}
		return location;
	}

	attribMaybe(name: string): number | null {
		this.#attribLocations[name] ??= this.engine.gl.getAttribLocation(this.#program, name);
		if (this.#attribLocations[name] === -1) {
			return null;
		}
		return this.#attribLocations[name];
	}

	addTransformFeedback(varNames: string[]) {
		this.engine.gl.transformFeedbackVaryings(this.#program, varNames, this.engine.gl.INTERLEAVED_ATTRIBS);
		return this;
	}
}
