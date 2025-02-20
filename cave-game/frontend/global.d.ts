declare module "*.vert" {
	const source: string;
	export default source;
}
declare module "*.frag" {
	const source: string;
	export default source;
}


declare module "*.glb" {
	const path: string;
	export default path;
}

declare module 'mat4-interpolate' {
	import { mat4 } from "gl-matrix";

  export default function interpolate(out:mat4, start: mat4, end: mat4, alpha: number): boolean
}
