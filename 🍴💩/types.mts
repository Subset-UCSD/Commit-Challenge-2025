export type Command =
	| {
			/** lists commands available */
			type: "list-commands";
		}
	| {
			/** sets the user's name */
			type: "my-name-is";
			name: string;
		};
