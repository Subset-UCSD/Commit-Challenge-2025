import { Ball, ClientMessage, ServerMessage, State } from "../server/Messaging";
import { obstacles } from "../server/obstickes";

const cnv = document.getElementById('cnv') as HTMLCanvasElement;
const ws = new WebSocket(window.location.href.replace(/^http/, "ws").replace(/\/$/, "").replace(/^https/, "wss"));

cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

const c = cnv.getContext("2d");

ws.addEventListener("message", handleServerMessage);

let state:State={
	balls:{},
	bullets:[]
}
let myUserId=-1

function handleServerMessage(data: MessageEvent) {
	let msg: ServerMessage | null = null;
	try {
		msg = JSON.parse(data.data);
	} catch (e) {}
	if (!msg) return;

	switch (msg.type) {
		case "ping":
			console.log("Received ping...");
			send({"type": "pong"});
			break;
		case 'state':
			state = msg.state
			break
			case 'you-are':
				myUserId=msg.userId
				break
				case 'please-move':
					pos.x = msg.x
					pos.y = msg.y
					vel.x = 0
					vel.y=0
					break
					case 'die':
						const bruh=Object.assign(document.createElement('div'),{className:Math.random()<0.5?'variation':'help'})
					document.body.append(bruh)	
					setTimeout(()=>bruh.remove(),500)
					break
	}
}

function send(data: ClientMessage) {
	if (ws.readyState == WebSocket.OPEN) ws.send(JSON.stringify(data));
}

function mod(a:number,b:number):number {
	return (a%b+b)%b
}

const GRID_SIZE = 50
let cameraX = 0, cameraY = 0
function draw() {
	// const myBall = state.balls[myUserId]
	// if (myBall) {

	// }
	cameraX += (pos.x - window.innerWidth / 2 - cameraX) * 0.3
	cameraY += (pos.y - window.innerHeight / 2 - cameraY) * 0.3
	c?.clearRect(0,0, window.innerWidth, window.innerHeight); 
	if (!c){return}
	c.save()
	c.strokeStyle = '#eee'
	c.beginPath()
	const startX=mod(-cameraX, GRID_SIZE)
	const startY=mod(-cameraY, GRID_SIZE)
	for (let x = startX; x <startX+ window.innerWidth;x+=GRID_SIZE){
		c.moveTo(x,0)
		c.lineTo(x,window.innerHeight)
	}
	for (let y = startY; y <startY+ window.innerHeight;y+=GRID_SIZE){
		c.moveTo(0,y,)
		c.lineTo(window.innerWidth,y)
	}
	c.stroke()
	c.translate(-cameraX, -cameraY)
	c.fillStyle=`hsl(${Math.sin(Date.now() / 100) * 10 + 30},100%,50%)`
	for (const {x,y,width,height} of obstacles) {
		//
		c.fillRect(x,y,width,height)
		
	}
	c.strokeStyle='black'
	// console.log(cameraX, cameraY)
	c.fillStyle = 'red'
	for (const {x,y} of state.bullets) {
		c.fillRect(x-2,y-2,4,4)
		// c.fillText('this is a bullet', x,y)
	}
	for (let [i, {x,y,kills,deaths}] of Object.entries(state.balls)) {
		if (+i === myUserId) {
			x = pos.x
			y = pos.y
			c.fillText('(this is you!!)', x,y+10)
		}
		c.fillStyle = `hsl(${+i * 57}, 50%, 50%)`
		c.beginPath()
		c.moveTo(x + 10, y)
		c.arc(x,y,10,0,Math.PI*2,)
		c.fill()
		c.stroke()
		c.fillText('hi i have kilt ' + kills+',die ' + deaths, x,y-10)
	}
	c.restore()
	// requestAnimationFrame(draw);
}
// draw()

type Vector2 = { x: number; y: number };

let pos: Vector2 = { x: 0, y: 0 };
let vel: Vector2 = { x: 0, y: 0 };
let movementInput: Vector2 = { x: 0, y: 0 };
let keysPressed: Set<string> = new Set();

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

const map = {w:'w',a:'a',s:'s',d:'d',arrowleft:'a',arrowdown:'s',arrowup:'w',arrowright:'d'}

function handleKeyDown(event: KeyboardEvent) {
	if (map[(event.key.toLowerCase())]) {
		keysPressed.add(map[event.key.toLowerCase()]);
		updateMovementInput();
	}
}

function handleKeyUp(event: KeyboardEvent) {
	if (keysPressed.has(map[event.key.toLowerCase()])) {
		keysPressed.delete(map[event.key.toLowerCase()]);
		updateMovementInput();
	}
}

function updateMovementInput() {
	let x = 0, y = 0;

	if (keysPressed.has("w")) y -= 1;
	if (keysPressed.has("s")) y += 1;
	if (keysPressed.has("a")) x -= 1;
	if (keysPressed.has("d")) x += 1;

	const length = Math.sqrt(x * x + y * y);
	if (length > 0) {
		movementInput = { x: x / length, y: y / length };
	} else {
		movementInput = { x: 0, y: 0 };
	}
}

// let myPosition = {x:0,y:0,xv:0,yv:0}

function updatePosition(deltaTime: number, speed: number) {
	vel.x += movementInput.x * speed * deltaTime;
	vel.y += movementInput.y * speed * deltaTime;
	vel.x *= 0.9
	vel.y *= 0.9
	pos.x += vel.x  * deltaTime;
	pos.y += vel.y  * deltaTime;
	send({
		type: "move",
		x: pos.x,
		y: pos.y
	});
}

// Simulate a game loop
const speed = 2000; // Units per second (these numbers no longer mean anytihng)
let lastTime = performance.now();

console.log('hey')
function gameLoop() {
	const currentTime = performance.now();
	requestAnimationFrame(gameLoop);
	// no gamer laptops! ~60 fps max.
	if (currentTime < lastTime + 1000/80){
		// console.log('too fast')
		return}
	const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
	lastTime = currentTime;

	updatePosition(deltaTime, speed);
	draw()

}
gameLoop();

document.addEventListener('click', e => {
	const dx = e.clientX - pos.x+cameraX//window.innerWidth/2
	const dy = e.clientY - pos.y+cameraY//window.innerHeight/2
	const length=Math.hypot(dx,dy)
	send({type:'bullet',xv:dx/length*20,yv:dy/length*20})
})
