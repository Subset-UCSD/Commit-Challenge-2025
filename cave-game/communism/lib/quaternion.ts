export function randomQuaternion() {
	let u1 = Math.random();
	let u2 = Math.random();
	let u3 = Math.random();

	let w = Math.sqrt(1 - u1) * Math.sin(2 * Math.PI * u2);
	let x = Math.sqrt(1 - u1) * Math.cos(2 * Math.PI * u2);
	let y = Math.sqrt(u1) * Math.sin(2 * Math.PI * u3);
	let z = Math.sqrt(u1) * Math.cos(2 * Math.PI * u3);

	return [w, x, y, z];
}
