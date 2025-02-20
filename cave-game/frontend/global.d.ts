declare module "*.vert" {
	const source: string;
	export default source;
}
declare module "*.frag" {
	const source: string;
	export default source;
}


declare module "*.gltf" {
	const gltf: any;
	export default gltf;
}
declare module "*.bin" {
	const path: string;
	export default path;
}
