import { mat4 } from "gl-matrix";

import { GltfParser } from "../../communism/gltf/parser";
import { componentSizes, ComponentType, componentTypes, GltfMaterial, GltfMode } from "../../communism/gltf/types";
import { expect, f32ArrayEqual, mergeMatrices } from "../../communism/utils";
import { Gl } from "./Gl";

export type ModelInstance = {
	transform: mat4;
};

type Accessor = {
	buffer: WebGLBuffer;
	vertexAttribPointerArgs: [size: number, type: ComponentType, normalized: boolean, stride: number, offset: number];
	count: number;
};

type ModelMesh = {
	vao: WebGLVertexArrayObject;
	previousTransformData?: Float32Array;
	modelTransformBuffer: WebGLBuffer;
	normalTransformBuffer: WebGLBuffer;
	materialOptions: GltfMaterial;
	meshTextures: { texture: WebGLTexture | null; name: string }[];
	indices: Accessor | null;
	count: number;
	transform: mat4;
	mode?: GltfMode;
};

export class GltfModel {
	name: string;
	engine: Gl;
	#meshes: ModelMesh[];

	constructor(engine: Gl, { root, buffers, images, meshes }: GltfParser) {
		this.name = root.buffers[0].uri ?? "bin";
		this.engine = engine;

		const gl = engine.gl;

		const glBuffers = root.accessors.map((accessor): Accessor => {
			const bufferView = root.bufferViews[accessor.bufferView];
			const length =
				accessor.count * componentTypes[accessor.componentType].BYTES_PER_ELEMENT * componentSizes[accessor.type];
			const data = new Uint8Array(
				buffers[bufferView.buffer],
				(bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0),
				length,
			);
			if (data.length < length) {
				throw new RangeError(
					`glTF data not big enough. Was told there'd be ${accessor.count} elements, but buffer only has ${data.length / (componentTypes[accessor.componentType].BYTES_PER_ELEMENT * componentSizes[accessor.type])} elements.`,
				);
			}
			const buffer = gl.createBuffer() ?? expect("buffer");
			gl.bindBuffer(bufferView.target, buffer);
			gl.bufferData(bufferView.target, data, gl.STATIC_DRAW);
			return {
				buffer,
				vertexAttribPointerArgs: [
					componentSizes[accessor.type],
					accessor.componentType,
					accessor.normalized ?? false,
					bufferView.byteStride ?? 0,
					0,
				],
				count: accessor.count,
			};
		});

		const textures =
			root.textures?.map(({ source, sampler: samplerIndex }) => {
				const image = images[source];
				const sampler = (root.samplers ?? [])[samplerIndex];
				const texture = gl.createTexture() ?? expect("Failed to create texture");

				const applyTextureParams = (image: ImageBitmap) => {
					// gl.texImage2D is much faster with ImageBitmap than
					// HTMLImageElement (380 ms to 60 ms)
					console.time(`uploading texture ${source} (${this.name})`);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
					console.timeEnd(`uploading texture ${source} (${this.name})`);

					if (sampler.wrapS) {
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
					}
					if (sampler.wrapT) {
						gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
					}
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
					gl.generateMipmap(gl.TEXTURE_2D);
				};

				engine.bindTexture(0, "2d", texture);
				if (image.width > engine.maxTextureSize || image.height > engine.maxTextureSize) {
					// Temporarily use blue pixel while image loads
					gl.texImage2D(
						gl.TEXTURE_2D,
						0,
						gl.RGBA,
						1,
						1,
						0,
						gl.RGBA,
						gl.UNSIGNED_BYTE,
						new Uint8Array([0, 0, 255, 255]),
					);

					console.time(`resizing texture ${source} (${this.name})`);
					createImageBitmap(image, {
						resizeWidth: Math.min(engine.maxTextureSize, (engine.maxTextureSize / image.height) * image.width),
						resizeHeight: Math.min(engine.maxTextureSize, (engine.maxTextureSize / image.width) * image.height),
					}).then((resized) => {
						console.timeEnd(`resizing texture ${source} (${this.name})`);
						engine.bindTexture(0, "2d", texture);
						applyTextureParams(resized);
					});
				} else {
					applyTextureParams(image);
				}

				return texture;
			}) ?? [];

		this.#meshes = meshes.map((mesh): ModelMesh => {
			const materialOptions = root.materials?.[mesh.material ?? 0] ?? {};

			const vao = gl.createVertexArray() ?? expect("Failed to create VAO");
			gl.bindVertexArray(vao);

			// https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html
			// https://stackoverflow.com/a/38853623
			const modelTransformBuffer = gl.createBuffer() ?? expect("Failed to create buffer");
			gl.bindBuffer(gl.ARRAY_BUFFER, modelTransformBuffer);
			for (let i = 0; i < 4; i++) {
				gl.enableVertexAttribArray(engine.gltfShader.attrib("a_model") + i);
				gl.vertexAttribPointer(engine.gltfShader.attrib("a_model") + i, 4, gl.FLOAT, false, 64, i * 16);
				gl.vertexAttribDivisor(engine.gltfShader.attrib("a_model") + i, 1);
			}
			const normalTransformBuffer = gl.createBuffer() ?? expect("Failed to create buffer");
			gl.bindBuffer(gl.ARRAY_BUFFER, normalTransformBuffer);
			for (let i = 0; i < 4; i++) {
				gl.enableVertexAttribArray(engine.gltfShader.attrib("a_normal_transform") + i);
				gl.vertexAttribPointer(engine.gltfShader.attrib("a_normal_transform") + i, 4, gl.FLOAT, false, 64, i * 16);
				gl.vertexAttribDivisor(engine.gltfShader.attrib("a_normal_transform") + i, 1);
			}

			const vbos = [
				mesh.attributes.POSITION !== undefined
					? { ...glBuffers[mesh.attributes.POSITION], attribName: "a_position" }
					: null,
				mesh.attributes.NORMAL !== undefined ? { ...glBuffers[mesh.attributes.NORMAL], attribName: "a_normal" } : null,
				mesh.attributes.TANGENT !== undefined
					? { ...glBuffers[mesh.attributes.TANGENT], attribName: "a_tangent" }
					: null,
				mesh.attributes.TEXCOORD_0 !== undefined
					? { ...glBuffers[mesh.attributes.TEXCOORD_0], attribName: "a_texcoord0" }
					: null,
				mesh.attributes.TEXCOORD_1 !== undefined
					? { ...glBuffers[mesh.attributes.TEXCOORD_1], attribName: "a_texcoord1" }
					: null,
				mesh.attributes.TEXCOORD_2 !== undefined
					? { ...glBuffers[mesh.attributes.TEXCOORD_2], attribName: "a_texcoord2" }
					: null,
				mesh.attributes.COLOR_0 !== undefined
					? { ...glBuffers[mesh.attributes.COLOR_0], attribName: "a_color0" }
					: null,
			].filter((x) => !!x);
			let count = Infinity;
			for (const vbo of vbos) {
				gl.bindBuffer(gl.ARRAY_BUFFER, vbo.buffer);
				const location = engine.gltfShader.attribMaybe(vbo.attribName);
				if (location === null) {
					continue;
				}
				gl.enableVertexAttribArray(location);
				gl.vertexAttribPointer(location, ...vbo.vertexAttribPointerArgs);
				if (vbo.count < count) {
					count = vbo.count;
				}
			}

			let indices: Accessor | null = null;
			if (mesh.indices) {
				indices = glBuffers[mesh.indices];
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
				count = indices.count;
			}

			const meshTextures = [
				{
					texture: materialOptions.pbrMetallicRoughness?.baseColorTexture
						? textures[materialOptions.pbrMetallicRoughness.baseColorTexture.index]
						: null,
					name: "texture_color",
				},
				{
					texture: materialOptions.pbrMetallicRoughness?.metallicRoughnessTexture
						? textures[materialOptions.pbrMetallicRoughness.metallicRoughnessTexture.index]
						: null,
					name: "texture_metallic_roughness",
				},
				{
					texture: materialOptions.normalTexture ? textures[materialOptions.normalTexture.index] : null,
					name: "texture_normal",
				},
				{
					texture: materialOptions.occlusionTexture ? textures[materialOptions.occlusionTexture.index] : null,
					name: "texture_occlusion",
				},
				{
					texture: materialOptions.emissiveTexture ? textures[materialOptions.emissiveTexture.index] : null,
					name: "texture_emissive",
				},
			];

			gl.bindVertexArray(null);
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

			return {
				vao,
				modelTransformBuffer,
				normalTransformBuffer,
				materialOptions,
				meshTextures,
				indices,
				count,
				transform: mesh.transform,
				mode: mesh.mode,
			};
		});
	}

	draw(models: ModelInstance[]) {
		const gl = this.engine.gl;

		// Default vertex color is white (since the base color is multiplied by it)
		gl.vertexAttrib4f(this.engine.gltfShader.attrib("a_color0"), 1, 1, 1, 1);

		for (const mesh of this.#meshes) {
			const {
				vao,
				modelTransformBuffer,
				normalTransformBuffer,
				materialOptions,
				meshTextures,
				indices,
				count,
				transform,
				mode,
			} = mesh;
			if (materialOptions.doubleSided) {
				gl.disable(gl.CULL_FACE);
			}

			// this.shader.engine.clearTextures();
			let textureIndex = 0;
			for (const { name, texture } of meshTextures) {
				if (texture) {
					this.engine.bindTexture(textureIndex, "2d", texture);
					gl.uniform1i(this.engine.gltfShader.uniform(`u_${name}`), textureIndex);
					textureIndex++;
					gl.uniform1i(this.engine.gltfShader.uniform(`u_has_${name}`), 1);
				} else {
					gl.uniform1i(this.engine.gltfShader.uniform(`u_has_${name}`), 0);
				}
			}

			gl.uniform1f(
				this.engine.gltfShader.uniform("u_alpha_cutoff"),
				materialOptions.alphaMode === "MASK" ? materialOptions.alphaCutoff : 0,
			);
			gl.uniform4fv(
				this.engine.gltfShader.uniform("u_base_color"),
				materialOptions.pbrMetallicRoughness?.baseColorFactor ?? [1, 1, 1, 1],
			);
			gl.uniform1f(
				this.engine.gltfShader.uniform("u_metallic"),
				materialOptions.pbrMetallicRoughness?.metallicFactor ?? 1,
			);
			gl.uniform1f(
				this.engine.gltfShader.uniform("u_roughness"),
				materialOptions.pbrMetallicRoughness?.roughnessFactor ?? 1,
			);
			gl.uniform3fv(this.engine.gltfShader.uniform("u_emissive"), materialOptions.emissiveFactor ?? [0, 0, 0]);
			gl.bindVertexArray(vao);

			const partTransforms = models.map((model) => mat4.mul(mat4.create(), model.transform, transform));
			const data = mergeMatrices(partTransforms);
			// Do not set buffer data if it didn't change
			if (!mesh.previousTransformData || !f32ArrayEqual(data, mesh.previousTransformData)) {
				gl.bindBuffer(gl.ARRAY_BUFFER, modelTransformBuffer);
				gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
				gl.bindBuffer(gl.ARRAY_BUFFER, normalTransformBuffer);
				gl.bufferData(
					gl.ARRAY_BUFFER,
					mergeMatrices(
						partTransforms.map((partTransform) =>
							// https://stackoverflow.com/a/13654666
							mat4.transpose(mat4.create(), mat4.invert(mat4.create(), partTransform)),
						),
					),
					gl.DYNAMIC_DRAW,
				);
				mesh.previousTransformData = data;
			}

			if (indices) {
				gl.drawElementsInstanced(mode ?? gl.TRIANGLES, count, indices.vertexAttribPointerArgs[1], 0, models.length);
			} else {
				gl.drawArraysInstanced(mode ?? gl.TRIANGLES, 0, count, models.length);
			}
			// this.shader.engine._drawCalls++;

			gl.bindVertexArray(null);
			if (materialOptions.doubleSided) {
				gl.enable(gl.CULL_FACE);
			}
		}
	}
}
