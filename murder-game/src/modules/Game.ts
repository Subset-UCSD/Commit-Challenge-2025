
function circlesIntersecting(circle1, circle2) {	
	return Math.sqrt((circle2.x - circle1.x) ** 2 + (circle2.y - circle1.y) ** 2) <= circle1.r + circle2.r;
}

function applyVelocity(circle, rects) {
	let initialX = circle.x;
	let initialY = circle.y;

	while (initialX === circle.x && initialY === circle.y &&
		(circle.dy !== 0 || circle.dx !== 0)) {
		circle.x += circle.dx;
		circle.y += circle.dy;

		for (let rect of rects) {
			if (circleRectCollision(circle, rect)) {
				circle.x = initialX;
				circle.y = initialY;

				while (circleRectCollision(circle, rect)) {
					circle.x += (circle.dx / Math.abs(circle.dx)) * circle.r;
					circle.y += (circle.dy / Math.abs(circle.dy)) * circle.r;
				}
			}
		}

		circle.dx = circle.dx * DECELERATION;
		circle.dy = circle.dy * DECELERATION;
		if (Math.abs(circle.dx * DECELERATION) < 0.15 && Math.abs(circle.dy * DECELERATION) < 0.15) {
			circle.dx = 0;
			circle.dy = 0;
		}
	}
}

function circleRectCollision(circle, rect) {
	let closestX = clamp(circle.x, rect[0], rect[0] + rect[2]);
	let closestY = clamp(circle.y, rect[1], rect[1] + rect[3]);

	let distanceX = circle.x - closestX;
	let distanceY = circle.y - closestY;
	let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

	if (distanceSquared < (circle.r * circle.r)) {
		let distance = Math.sqrt(distanceSquared);
		let overlap = circle.r - distance;

		if (distance > 0) {
			circle.x += overlap * (distanceX / distance);
			circle.y += overlap * (distanceY / distance);
		}

		let velocityMagnitude = Math.sqrt(circle.dx * circle.dx + circle.dy * circle.dy);
		if (velocityMagnitude > 0) {
			let normalX = distanceX / distance;
			let normalY = distanceY / distance;
			let dotProduct = circle.dx * normalX + circle.dy * normalY;

			if (dotProduct < 0) {
				circle.dx -= 2 * dotProduct * normalX;
				circle.dy -= 2 * dotProduct * normalY;
			}
		}
		return true;
	}
	return false;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}