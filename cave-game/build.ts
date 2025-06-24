// node --experimental-strip-types build.ts watch

import * as esbuild from "esbuild";
import type { Nodemon, NodemonSettings } from "nodemon";
import nodemon from "nodemon";
import { exit } from "process";

const subcommands = ["build", "watch"];
const subcommand = process.argv[2];
if (!subcommands.includes(subcommand)) {
	console.error(`Usage: node build.ts (${subcommands.join("|")})`);
	exit(1);
}

const watchMode = subcommand === "watch";

const serverContext = await esbuild.context({
	entryPoints: ["server/index.ts"],
	bundle: true,
	platform: "node",
	packages: "external",
	outdir: "dist/",
	// outfile: "dist/index.js",
	format: "esm",
});

const clientContext = await esbuild.context({
	entryPoints: ["client/index.ts"],
	bundle: true,
	loader: {
		".frag": "text",
		".vert": "text",
		".glb": "file",
	},
	outdir: "public/",
	format: "esm",
	supported: {
		nesting: false,
	},
	minify: !watchMode,
	sourcemap: true,
});

if (watchMode) {
	serverContext.watch();
	clientContext.watch();
	// wtf
	(nodemon as any as (settings: NodemonSettings) => Nodemon)({
		script: "dist/index.js",
		watch: ["dist/"],
	});

	process.on("SIGINT", () => {
		console.log();
		process.exit();
	});
} else {
	await serverContext.rebuild();
	await serverContext.dispose();
	await clientContext.rebuild();
	await clientContext.dispose();
}
