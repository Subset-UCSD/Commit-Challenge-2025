const cnv = document.getElementById('cnv');
const ws = new WebSocket(window.location.href.replace(/^http/, "ws").replace(/\/$/, "").replace(/^https/, "wss"));
const SLOWNESS = 20;

cnv.width = window.innerWidth;
cnv.height = window.innerHeight;

let mouse = { x1: 0, y1: 0, x2: 0, y2: 0 };
let mousedown = false;
let c = cnv.getContext("2d");
let colliders;
let ball;
let flag;

document.addEventListener("mousedown", e => {
	mouse.x1 = e.x;
	mouse.y1 = e.y;
	mousedown = true;
});

document.addEventListener("mousemove", e => {
	mouse.x2 = e.x;
	mouse.y2 = e.y;
});

document.addEventListener("mouseup", e => {
	mousedown = false;
	mouse.x2 = e.x;
	mouse.y2 = e.y;
	if (ws.readyState === ws.OPEN) {
		ws.send(JSON.stringify({
			type: "launch",
			value: {
				dx: (mouse.x1 - mouse.x2) / SLOWNESS,
				dy: (mouse.y1 - mouse.y2) / SLOWNESS
			}
		}));
	}
});

ws.addEventListener("message", msg => {
	let data;
	try {
		data = JSON.parse(msg.data);
	} catch(e) {}
	switch(data.type) {
		case "colliders":
			colliders = data.value;
		break;
		case "ball":
			ball = {
				...data.value,
				r: 12
			};
		break;
		case "flag":
			flag = data.value;
		break;
		case "congrats":
			document.body.innerHTML = `Thank you so much a for to playing my game! ` + data.value;
		case "start":
			draw();
		break;
	}
});

function draw() {
	console.log(ball);
	if (ball) {
		c.clearRect(0, 0, cnv.width, cnv.height);
		for (let col of colliders) {
			c.fillStyle = "gray";
			c.fillRect(...col);
			c.fill();
		}
		c.beginPath();
		c.fillStyle = "#DD2F2F";
		c.arc(flag.x, flag.y, flag.r, 0, 2 * Math.PI);
		c.fill();
		c.beginPath();
		c.fillStyle = `rgba(110,110,200,1)`;
		c.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
		c.fill();
		if (mousedown && !ball.moving) {
			c.beginPath();
			c.fillStyle = "#BDBDBD";
			c.arc(ball.x, ball.y, 3, 0, 2 * Math.PI);
			c.arc(ball.x + (mouse.x2 - mouse.x1), ball.y + (mouse.y2 - mouse.y1), 3, 0, 2 * Math.PI);
			c.fill();
			c.beginPath();
			c.lineWidth = 6;
			c.strokeStyle = "#BDBDBD";
			c.moveTo(ball.x, ball.y);
			c.lineTo(ball.x + (mouse.x2 - mouse.x1), ball.y + (mouse.y2 - mouse.y1));
			c.stroke();
		}
	}
	requestAnimationFrame(draw);
}