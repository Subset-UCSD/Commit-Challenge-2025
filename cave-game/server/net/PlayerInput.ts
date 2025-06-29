import { ClientInputs } from "../../communism/messages";
import { YXZEuler } from "../../communism/types";

/**
 * Runs `func` on every key and creates an object out of the results. Useful for
 * looping over keys.
 *
 * Mostly exists as a TypeScript hack.
 *
 * wow this is so unnecessarily hacky! you've managed to make formerly clear code incomprehensible :) -nick
 */
function mapKeys<T>(func: (key: keyof ClientInputs) => T): Record<keyof ClientInputs, T> {
	return {
		forward: func("forward"),
		backward: func("backward"),
		right: func("right"),
		left: func("left"),
		jump: func("jump"),
	};
}

export class PlayerInput {
	private data = mapKeys(() => false);
	private posedge = mapKeys(() => false);
	private lookDir: YXZEuler = {x:0, y:0, z: 0};

	/**
	 * Called whenever the client sends new data about inputs
	 * @param newData
	 */
	updateInputs(newData: ClientInputs) {
		this.data = mapKeys((key) => {
			if (!this.data[key] && newData[key]) {
				this.posedge[key] = true;
			}
			return newData[key];
		});
	}

	setLookDir(dir: YXZEuler) {
		this.lookDir = dir;
	}
	getLookDir() {
		return this.lookDir;
	}

	// Don't let players use
	getInputs(): ClientInputs {
		return { ...mapKeys((key) => this.data[key] || this.posedge[key]) };
	}

	// Getting posedge
	getPosedge(): ClientInputs {
		return this.posedge;
	}

	// This function is called to update the player inputs
	serverTick() {
		mapKeys((key) => {
			this.posedge[key] = false;
		});
	}
}
