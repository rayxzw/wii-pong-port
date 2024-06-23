const canvas = document.getElementById("canvas");
canvas.width = 300;
canvas.height = 500;
const c = canvas.getContext("2d");
c.lineWidth = 2;
let raf; // used to start/stop canvas

const output = document.querySelector(".output");
const resetBtn = document.getElementById("resetBtn");
const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.hidden = true;

let running = false;
class Vector {
	constructor(x=0, y=0) {
		this.x = x;
		this.y = y;
	}

	add(other) {
		return new Vector(this.x + other.x, this.y + other.y);
	}

	sub(other) {
		return new Vector(this.x - other.x, this.y - other.y);
	}

	dot(other) {
		return this.x*other.x + this.y*other.y;
	}

	scale(factor) {
		return new Vector(this.x * factor, this.y * factor);
	}

	mag() {
		return Math.sqrt(this.x**2 + this.y**2);
	}

	unit() {
		let tmag = this.mag();
		if (tmag == 0) {
			return new Vector();
		}
		return new Vector(this.x/tmag, this.y/tmag);
	}

	normal() {
		return new Vector(-this.y, this.x);
	}

	draw(ox, oy) {
		c.beginPath();
		c.moveTo(ox, oy);
		c.lineTo(ox + this.x, oy + this.y);
		c.strokeStyle = "red";
		c.stroke();
	}
}

class Ball {
	constructor(x, y, r, vx, vy, color="#00ff00") {
		this.pos = new Vector(x, y);
		this.v = new Vector(vx, vy);
		this.r = r;
		this.color = color;
	}

	draw() {
		c.beginPath();
		c.arc(this.pos.x, this.pos.y, this.r, 0, 2*Math.PI);
		c.strokeStyle = this.color;
		c.stroke();
	}

	update() {
		// game boundaries
		if (this.pos.x - this.r < 0) {
			this.v.x *= -1;
			this.pos.x = this.r;
		}
		if (this.pos.x + this.r > canvas.width) {
			this.v.x *= -1;
			this.pos.x = canvas.width - this.r;
		}
		if (this.pos.y - this.r < 0) {
			let coin1 = Math.round(Math.random()) * 2 - 1;
			let coin2 = Math.round(Math.random()) * 2 - 1;
			this.v = new Vector(coin1*BALL_SPAWN_VX, coin2*BALL_SPAWN_VY);
			this.pos = new Vector(canvas.width/2, canvas.height/2);
			score1++;
		}
		if (this.pos.y + this.r > canvas.height) {
			let coin1 = Math.round(Math.random()) * 2 - 1;
			let coin2 = Math.round(Math.random()) * 2 - 1;

			this.v = new Vector(coin1*BALL_SPAWN_VX, coin2*BALL_SPAWN_VY);
			this.pos = new Vector(canvas.width/2, canvas.height/2);
			score2++;
		}
		this.pos = this.pos.add(this.v);
	}
}

class Paddle {
	constructor(x, y, w, h, color="#ff0000") {
		this.pos = new Vector(x, y);
		this.w = w;
		this.h = h;
		this.color = color;

		this.v = new Vector();
	}

	draw() {
		c.strokeStyle = this.color;
		c.strokeRect(this.pos.x, this.pos.y, this.w, this.h);
	}

	update(newPos) {
		if (newPos == undefined) {
			this.pos = this.pos.add(this.v);
		} else {
			this.pos = newPos;
		}
	}
}
// game constants
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 10;
const BALL_RADIUS = 3;
const GAME_SPACING = 30;
const BALL_SPAWN_VX = 4;
const BALL_SPAWN_VY = 4;
const MULTIPLIER = 1.2;
const MAX_SCORE = 5;

let ball, paddle1, paddle2, score1, score2;

const xRange = canvas.width - 2*BALL_RADIUS;
const yRange = canvas.height - 2*BALL_RADIUS;

function handleOrientation(event) {
	let x = event.beta; // In degree in the range [-180,180)
	let y = event.gamma; // In degree in the range [-90,90)

	output.textContent = `beta: ${x}\n`;
	output.textContent += `gamma: ${y}\n`;

	// Because we don't want to have the device upside down
	// We constrain the x value to the range [-90,90]
	if (x > 90) {
		x = 90;
	}
	if (x < -90) {
		x = -90;
	}

	// To make computation easier we shift the range of
	// x and y to [0,180]
	x += 90;
	y += 90;

	output.textContent += `nbeta: ${x}\n`;
	output.textContent += `ngamma: ${y}\n`;

	// rotating device around the y axis moves paddle horizontally
	// rotating device around the x axis moves paddle vertically
	// for rotation IS position
	// let newX = (yRange * y) / 180 + ball.r;
	// let newY = (xRange * x) / 180 + ball.r;
	// for rotation IS velocity
	// let newX = ball.pos.x + (y - 90) * 0.1;
	// let newY = ball.pos.y + (x - 90) * 0.1;
	// ball.update(newX, newY);

	//let newX = paddle1.pos.x + (y - 90) * 0.1;
	//let newPos = new Vector(newX, paddle1.pos.y);
	//paddle1.update(newPos);

	let newVx = (y - 90) * 0.1;
	paddle1.v.x = newVx;
	paddle1.update();
}

resetBtn.onclick = e => {
	init();
	resetBtn.innerHTML = "Reset";
	pauseBtn.hidden = false;
};

pauseBtn.onclick = e => {
	e.preventDefault();
  
	// Request permission for iOS 13+ devices
	if (DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === "function") {
		DeviceMotionEvent.requestPermission();
	}
  
	if (!running) {
		window.addEventListener("deviceorientation", handleOrientation);
		running = true;
		raf = window.requestAnimationFrame(animate);
		pauseBtn.innerHTML = "STOP";
	} else {
		window.removeEventListener("deviceorientation", handleOrientation);
		running = false;
		window.cancelAnimationFrame(raf);
		pauseBtn.innerHTML = "Start";
	}
};

// returns rectangle's closest vertex to circle as vector
function closestVertexRC(r, b) {
	let vertices = [r.pos, r.pos.add(new Vector(r.w, 0)), r.pos.add(new Vector(0, r.h)), r.pos.add(new Vector(r.w, r.h))];
	let closestVertex = vertices[0];
	let minDist = vertices[0].sub(b.pos).mag();
	for (let i = 1; i < 4; i++) {
		let cMinDist = vertices[i].sub(b.pos).mag();
		if (cMinDist < minDist) {
			minDist = cMinDist;
			closestVertex = vertices[i];
		}
	}
	return closestVertex;
}

// return MTV for axis aligned box and regular ball
// MTV points towards ball
function collideRC(r, b) {
	// check rectangle axes first
	let raxes = [new Vector(r.w, 0), new Vector(0, r.h)];
	raxes[0] = raxes[0].normal().unit(); // <0, 1>
	raxes[1] = raxes[1].normal().unit(); // <-1, 0>

	// flip axis depending on where ball is
	if (b.pos.x < (r.pos.x + r.w/2)) {
		raxes[1] = raxes[1].scale(-1);
	}
	if (b.pos.y > (r.pos.y + r.h/2)) {
		raxes[0] = raxes[0].scale(-1);
	}

	let corners = [new Vector(r.pos.x, r.pos.y), new Vector(r.pos.x + r.w, r.pos.y), new Vector(r.pos.x, r.pos.y + r.h), new Vector(r.pos.x + r.w, r.pos.y + r.h)];

	let rrminprojs = [corners[0].dot(raxes[0]), corners[0].dot(raxes[1])];
	let rrmaxprojs = [corners[0].dot(raxes[0]), corners[0].dot(raxes[1])];

	let brminprojs = [b.pos.dot(raxes[0]) - b.r, b.pos.dot(raxes[1]) - b.r];
	let brmaxprojs = [b.pos.dot(raxes[0]) + b.r, b.pos.dot(raxes[1]) + b.r];

	// mtvMag is always positive
	// mtvUnit always points to rectangle
	let mtvMag = -1;
	let mtvUnit = raxes[0];
	for (let i = 0; i < raxes.length; i++) {
		// rectangle projection
		for (let j = 1; j < corners.length; j++) {
			let proj = corners[j].dot(raxes[i]);
			// due to rectange symmetry the below isn't necessary
			if (proj < rrminprojs[i]) {
				rrminprojs[i] = proj;
			} else if (proj > rrmaxprojs[i]) {
				rrmaxprojs[i] = proj;
			}
		}
		// ball projection already done
		if (brminprojs[i] >= rrmaxprojs[i] || brmaxprojs[i] <= rrminprojs[i]) {
			return new Vector();
		}
		// minimum translation vector (MTV)
		let tmp = Math.min(brmaxprojs[i] - rrminprojs[i], rrmaxprojs[i] - brminprojs[i]);
		if (mtvMag == -1) {
			mtvMag = tmp;
			continue;
		}
		if (tmp < mtvMag) {
			mtvMag = tmp;
			mtvUnit = raxes[i];
		}
	}

	// continue with ball axis if no gap
	let bax = closestVertexRC(r, b).sub(b.pos).unit();
	let rbminproj = corners[0].dot(bax)
	let rbmaxproj = rbminproj;

	let bbminproj = b.pos.dot(bax) - b.r;
	let bbmaxproj = b.pos.dot(bax) + b.r;

	// rectangle projection
	for (let j = 1; j < corners.length; j++) {
		let proj = corners[j].dot(bax);
		if (proj < rbminproj) {
			rbminproj = proj;
		} else if (proj > rbmaxproj) {
			rbmaxproj = proj;
		}
	}
	// ball projection already done
	if (bbminproj >= rbmaxproj || bbmaxproj <= rbminproj) {
		return new Vector();
	}
	let tmp = Math.min(bbmaxproj - rbminproj, rbmaxproj - bbminproj);
	if (tmp < mtvMag) {
		mtvMag = tmp;
		mtvUnit = bax;
	}
	return mtvUnit.scale(-mtvMag);
}

function handleCollision(r, b, mtv) {
	b.pos = b.pos.add(mtv);
	if (mtv.x == 0 && ((mtv.y < 0) != (b.v.y < 0))) { // only flip v when needed
		b.v.y *= -MULTIPLIER;
		b.v.x += r.v.x/2;
	} else if (mtv.y == 0 && ((mtv.x < 0) != (b.v.x < 0))) {
		b.v.x *= -MULTIPLIER;
		b.v.y += r.v.y/2;
	} else {
		let corner = closestVertexRC(r, b).sub(r.pos);

		// rProp and bProp are 90 degree rotations of <1, 1>
		let rProp = (new Vector(corner.x/r.w, corner.y/r.h)).scale(2).sub(new Vector(1, 1));
		let bProp = new Vector(b.v.x/Math.abs(b.v.x), b.v.y/Math.abs(b.v.y));
		let sum = rProp.add(bProp);
		let components = [MULTIPLIER, MULTIPLIER];
		if (sum.x == 0) {
			components[0] = -MULTIPLIER;
		}
		if (sum.y == 0) {
			components[1] = -MULTIPLIER;
		}
		b.v = new Vector(components[0] * b.v.x, components[1] * b.v.y);
		b.v = b.v.add(r.v.scale(1/2));
	}
}

function animate() {
	c.clearRect(0, 0, canvas.width, canvas.height);
	
	// midline
	c.strokeStyle = "white";
	c.beginPath();
	c.moveTo(0, canvas.height/2);
	c.lineTo(canvas.width, canvas.height/2);
	c.stroke();
	
	ball.draw();
	paddle1.draw();
	paddle2.draw();

	let p1mtv = collideRC(paddle1, ball);
	let p2mtv = collideRC(paddle2, ball);

	if (p1mtv.mag() != 0) {
		handleCollision(paddle1, ball, p1mtv);
		console.log("XOLLIDE");
	} else if (p2mtv.mag() != 0) {
		handleCollision(paddle2, ball, p2mtv);
	}
	
	ball.update();
	// paddle1 is updated in handleOrientation
	let newPos2 = new Vector(ball.pos.x - paddle2.w/2, paddle2.pos.y);
	let delta = newPos2.sub(paddle2.pos);
	if (delta.mag() > 5) {
		delta = delta.unit().scale(5);
	}

	paddle2.update(paddle2.pos.add(delta));

	// let minLine = closestVertexRC(paddle1, ball).sub(ball.pos);
	// minLine.draw(ball.pos.x, ball.pos.y);

	c.font = "20px monospace";
	c.fillStyle = "#ffffff";
	c.fillText(score2, 20, canvas.height/2 - 20);
	c.fillText(score1, 20, canvas.height/2 + 35);

	if (score1 >= MAX_SCORE) {
		pauseBtn.hidden = true;
		c.fillStyle = "#ff0000";
		c.fillRect(0, 0, canvas.width, canvas.height);
		let winText = `P1 wins\n${score1} - ${score2}`;
		c.textAlign = "center";
		c.fillStyle = "#000000";
		c.font = "bold 30px monospace";
		c.fillText(winText, canvas.width/2, canvas.height/2);
		return;
	}
	if (score2 >= MAX_SCORE) {
		pauseBtn.hidden = true;
		c.fillStyle = "#0000ff";
		c.fillRect(0, 0, canvas.width, canvas.height);
		let winText = `P2 wins\n${score2} - ${score1}`;
		c.textAlign = "center";
		c.fillStyle = "#000000";
		c.font = "bold 30px monospace";
		c.fillText(winText, canvas.width/2, canvas.height/2);
		return;
	}

	raf = window.requestAnimationFrame(animate);
}

function init() {
	//cw/2, ch/2, 5, 2, 2
	ball = new Ball(canvas.width/2, canvas.height/2, BALL_RADIUS, BALL_SPAWN_VX, BALL_SPAWN_VY);
	// cw/2, ch - 30, 80, 10
	paddle1 = new Paddle(canvas.width/2 - PLAYER_WIDTH/2, canvas.height - PLAYER_HEIGHT - GAME_SPACING, PLAYER_WIDTH, PLAYER_HEIGHT); // player
	paddle2 = new Paddle(canvas.width/2 - PLAYER_WIDTH/2, GAME_SPACING, PLAYER_WIDTH, PLAYER_HEIGHT, "#0000FF");

	score1 = 0;
	score2 = 0;
	pauseBtn.click();
	pauseBtn.click();
	pauseBtn.hidden = false;
	output.textContent += "INITIALIZED\n";
}

