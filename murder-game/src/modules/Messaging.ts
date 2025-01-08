type BulletMessage = {

};

export type ClientMessage = 
	BulletMessage |
	;

export function handleMessage(data: any) {
	let parsed: ClientMessage;
	try {
		parsed = JSON.parse(data);
	} catch (e) {}
	if (!parsed) {
		return;
	}

}