
function circleIntersects(circle1, circle2) {	
	return Math.sqrt((circle2.x - circle1.x) ** 2 + (circle2.y - circle1.y) ** 2) <= circle1.r + circle2.r;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}