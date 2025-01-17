type BulletMessage = {
	type: "bullet"
	xv:number,yv:number
};

export type Ball={
	userId:number
	x:number,y:number
	kills:number
	deaths:number
}
export type Bullet={
	x:number,y:number
	xv:number,yv:number
	dieTime: number
	owner:number
}
export type State = {
	balls: Record<number, Ball>
	bullets: Bullet[]
}
export type StateMessage = {
	type: 'state'
	state:State
}

export type ClientMessage = 
	BulletMessage |
	{type: "pong"}
	|{type:'move',x:number,y:number};

export type ServerMessage = 
StateMessage|
{type:'you-are',userId:number}|
	{type: "ping"}
	|{type:'die'}
	|{type:'please-move',x:number,y:number};

