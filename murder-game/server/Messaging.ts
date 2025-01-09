type BulletMessage = {
	type: "bullet"
};

export type ClientMessage = 
	BulletMessage |
	{type: "pong"};

export type ServerMessage = 
	{type: "ping"};

export function handleClientMessage(data: any) {
	let parsed: ClientMessage | null = null;
	try {
		parsed = JSON.parse(data);
	} catch (e) {}
	if (!parsed) return;

	switch (parsed.type) {
		case "pong":
			console.log("Got pong...");
			break;
		case "bullet":
	}
}