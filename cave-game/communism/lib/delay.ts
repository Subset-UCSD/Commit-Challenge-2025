const NODEJS_TIMER_RESOLUTION_MS = 15;

/**
 * Returns a promise that resolves after the given amount of time. Useful for
 * waiting in an async function. Async version of `setTimeout`.
 *
 * NOTE: `setTimeout` can be very imprecise. Use with caution.
 *
 * @param ms Time to wait, in milliseconds.
 *
 * @example
 * // Print `hey` every second
 * while (true) {
 *   console.log("hey");
 *   await delay(1000);
 * }
 */
export async function delay(ms: number): Promise<void> {
	let start = performance.now();
	return new Promise((resolve) => {
		let num_sleeps = Math.floor(ms / NODEJS_TIMER_RESOLUTION_MS) - 1;
		const spinner = async () => {
			while (performance.now() - start < ms) {
				await immediate();
			}
			resolve();
		}
		// If we can get closer without spinning, do that first, otherwise just spin
		// This is super hacky but js sucks for this particular task so it's whatever
		if (num_sleeps > 0) {
			setTimeout(spinner, num_sleeps * NODEJS_TIMER_RESOLUTION_MS);
		} else {
			spinner();
		}
	});
}

const immediate = () => new Promise((resolve) => setImmediate(resolve));
