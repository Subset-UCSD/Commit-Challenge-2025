export type ServerModelObject = {
	id: string;
	/** url of .glb; also serves as ID for model */
	model: string;
	/** 4x4 matrix (gl-matrix `mat4`) */
	transform: number[];
	/**
	 * defines a transition animation between previous and new transform. inspired
	 * by minecraft block display interpolation: https://youtu.be/8MPDyaYBUnM?t=64
	 */
	interpolate?: {
		/** delay after receiving object to begin interpolation, in milliseconds. defaults to 0, starting immediately */
		delay?: number;
		/** length of transition animation in milliseconds */
		duration: number;
	};
};

export type ServerMessage =
	| { type: "chats"; contents: string[] }
	| { type: "chat"; user: number; content: string }
	| { type: "you are"; id: number }
	| {
			type: "entire-state";
			objects: ServerModelObject[];
	  }
	| {
			type: "join-response";
			id: string;
	  };

export type ClientMessage =
	| { type: "chat"; message: string }
	| {
			/**
			 * this event is sent whenever a key is PRESSED DOWN or LIFTED
			 * however.. it is not sent when the page first loads and no keys are pressed
			 * !
			 */
			type: "key-state-update";
			/**
			 * A list of keys that are being held down
			 *
			 * these are physical keys from `KeyEvent.code`
			 * documentation of values: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
			 * for example: `KeyW` `ShiftLeft` `ArrowUp`
			 * physical keys, so on AZERTY keyboard A key would be KeyQ
			 *
			 * known issue: modifier keys can be weird
			 * press left shift -> hold right shift -> lift left shift. right shift will remain down
			 */
			keys: string[];
	  }
	| {
			type: "join";
			id?: string;
			name: string;
	  };
