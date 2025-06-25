import { allowDomExceptions } from "./lib/allowDomExceptions";

export type CamGlamMethods = {
  lockPointer: (isTouch: boolean) => void;
	unlockPointer: () => void;
}

export function listenToMovement(elem: HTMLElement, callback: (movementX: number, movementY: number, isTouch: boolean) => void) {
  elem.addEventListener("mousemove", (e) => {
			if (document.pointerLockElement === elem) {
				callback(e.movementX,e.movementY,false);
			}
		});

type DragState = { pointerId: number; lastX: number; lastY: number };
		let dragState: DragState | null = null;
		document.addEventListener("pointerdown", (e) => {
			if (e.pointerType === "touch" && !dragState) {
				dragState = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY };
				try {
					elem.setPointerCapture(e.pointerId);
				} catch (error) {
					// - Failed to execute 'setPointerCapture' on 'Element':
					//   InvalidStateError [touching after long press right click on
					//   Windows?]
					allowDomExceptions(error, ["InvalidStateError"]);
				}
			}
		});
		elem.addEventListener("pointermove", (e) => {
			if (e.pointerId === dragState?.pointerId) {
				const movementX = e.clientX - dragState.lastX;
				const movementY = e.clientY - dragState.lastY;
				callback( movementX, movementY ,true);
				dragState.lastX = e.clientX;
				dragState.lastY = e.clientY;
			}
		});
		const handlePointerEnd = (e: PointerEvent) => {
			if (e.pointerId === dragState?.pointerId) {
				dragState = null;
			}
		};
		elem.addEventListener("pointerup", handlePointerEnd);
		elem.addEventListener("pointercancel", handlePointerEnd);

    const lockPointer = async (isTouch: boolean) => {
		// audioContext.resume();

		// Lock pointer to canvas
		// https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
		if (!isTouch && !document.pointerLockElement) {
			try {
				await elem.requestPointerLock({ unadjustedMovement: true });
			} catch (error) {
				// Ignore these errors:
				// - SecurityError: The user has exited the lock before this request was
				//   completed. [clicking screen shortly after pressing escape]
				// - UnknownError: If you see this error we have a bug. Please report
				//   this bug to chromium. [tapping screen on Android]
				allowDomExceptions(error, ["SecurityError", "UnknownError"]);
			}
		}

		// Enter landscape mode (Android only)
		// https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock
		if ("lock" in screen.orientation && screen.orientation.type.startsWith("portrait")) {
			try {
				await document.documentElement.requestFullscreen();
				await screen.orientation.lock("landscape");
			} catch (error) {
				// Ignore these errors:
				// - NotSupportedError: screen.orientation.lock() is not available on
				//   this device.
				allowDomExceptions(error, ["NotSupportedError"]);
			}
		}
	};

	const unlockPointer = () => {
		document.exitPointerLock();
	};

  return {lockPointer,
		unlockPointer,}
}
