let _Gen = document.getElementById("generation");
let _Lebend = document.getElementById("lebend");
let _Score = document.getElementById("score");
let _Highscore = document.getElementById("highscore");

const CV = document.getElementById("spiel");
let c = CV.getContext("2d");

const W = innerWidth;
const H = innerHeight;

CV.width = W;
CV.height = H;

c.fillStyle = "black";
c.fillRect(0, 0, W, H);

let updater;
let fastUpdater;

let Gen = 1;
let Rate = 0.2;

let rockets = [];
let N = 200;
let alive = N;
let scores = [];
let highest = 0;
let highscore = 0;
let highscores = [];
let bestes = null;
let neuesBestes = null;

let asteroids = [];
let astN = 3;
let lanes = 3;
let normSpeed = 30;
let speed = normSpeed;
let inc = 0.2;

let player;

function Start() {
  _Lebend.innerHTML = `Noch am Leben: ${alive} von ${N}`;

  for (let i = 0; i < N; i++) {
    rockets.push(new Rocket(W * 0.2, 1, false));
  }

  player = new Rocket(W * 0.1, 1, true);

  for (let i = 0; i < astN; i++) {
    asteroids.push(new Asteroid(i, i % lanes));
  }

  // fastUpdater = setInterval(Update, 1);
  Update();
}

function Update() {
  c.fillStyle = "black";
  c.fillRect(0, 0, W, H);

  if (scores.length >= rockets.length) {
    NextGen();
  }

  player.update();

  rockets.forEach((r) => {
    if (r.mitdabei) r.update();
  });

  asteroids.forEach((ast) => {
    ast.update();
  });

  updater = requestAnimationFrame(Update);
}

function NextGen() {
  let newHigh = false;

  let totalScore = 0;
  scores.forEach((s) => {
    totalScore += s;
  });
  if (highest > highscore) {
    highscore = highest;
    newHigh = true;
    _Highscore.innerHTML = `Highscore: ${highscore}`;
  }

  let neueGen = [];

  rockets.forEach((r) => {
    if (totalScore > 0) r.fitness = r.score / totalScore;
    else r.fitness = 0;

    let kopien = Math.floor(r.fitness * N);

    for (let i = 0; i < kopien; i++) {
      let kopie = r.brain.kopie().mutiert(Rate * (1 + i / kopien));
      neueGen.push(kopie);
    }

    r.score = 0;
    r.lane = 1;
    r.y = (r.lane * H) / lanes + H / (2 * lanes);
    r.dir = 0;
    r.mitdabei = true;
  });

  neueGen.push(rockets[Bestes()].brain.kopie());
  neuesBestes = neueGen.length-1;

  while (neueGen.length < rockets.length) {
    neueGen.push(rockets[bestes].brain.kopie().mutiert(Rate));
  }

  rockets.forEach((r, i) => {
    r.brain = neueGen[i];
  });

  asteroids = [];
  for (let i = 0; i < astN; i++) {
    asteroids.push(new Asteroid(i, i % lanes));
  }

  highscores.push(highest);

  console.log("Generation " + Gen);
  if (newHigh) console.log("NEUER HIGHSCORE! ---------------");
  console.log("Highscore: " + highscore);
  console.log("dieser Durchlauf: " + highest);
  console.log(" ");

  bestes = neuesBestes;
  scores = [];
  totalScore = 0;
  highest = 0;
  alive = N;
  _Lebend.innerHTML = `Noch am Leben: ${alive} von ${N}`;
  _Score.innerHTML = `Score: ${highest}`;

  speed = normSpeed;

  if (Rate > 0.01) Rate *= 0.98;

  Gen++;
  _Gen.innerHTML = `Generation: ${Gen}`;
}

function Bestes() {
  let index = null;
  let max = -1;

  rockets.forEach((r, i) => {
    if (r.fitness > max) {
      max = r.fitness;
      index = i;
    }
  });

  bestes = index;
  return index;
}

class Rocket {
  constructor(x, lane, human) {
    this.lane = lane;
    this.changingLane = false;
    this.x = x;
    this.y = (this.lane * H) / lanes + H / (2 * lanes);
    this.a = 0;
    this.dir = 0;
    this.vel = 1.5;

    this.h = 50;
    this.w = this.h * 1.25;

    this.brain = new NN([astN + 1, 4, 2]);
    this.score = 0;
    this.fitness = null;
    this.mitdabei = true;

    this.human = human;
  }

  update() {
    if (!this.changingLane && !this.human) {
      let input = [];
      input[0] = this.y / H;
      input[1] = asteroids[0].x / W;
      input[2] = asteroids[1].x / W;
      input[3] = asteroids[2].x / W;
      this.findOutput(this.brain.feedforward(input));

      this.lane += this.dir;
      if (this.lane < 0) this.lane = 0;
      if (this.lane > 2) this.lane = 2;

      this.changingLane = true;
    }

    if (this.changingLane) this.changeLane();
    // this.y = (this.lane * H) / lanes + H / (2 * lanes);

    this.show();
  }

  changeLane() {
    if (this.y != (this.lane * H) / lanes + H / (2 * lanes)) {
      this.y += this.dir * this.vel * speed;
    }

    if (this.y <= H / (2 * lanes)) {
      this.y = H / (2 * lanes);
      this.changingLane = false;
    }

    if (this.y >= (2 * H) / lanes + H / (2 * lanes)) {
      this.y = (2 * H) / lanes + H / (2 * lanes);
      this.changingLane = false;
    }

    if (
      ((this.y - this.vel * speed <= H / 2 && this.y >= H / 2) ||
        (this.y + this.vel * speed >= H / 2 && this.y <= H / 2)) &&
      this.lane == 1
    ) {
      this.y = H / 2;
      this.changingLane = false;
    }
  }

  humanLane(d) {
    this.dir = d;
    this.lane += this.dir;
    if (this.lane < 0) this.lane = 0;
    if (this.lane > 2) this.lane = 2;

    this.changingLane = true;
  }

  show() {
    let alpha = 100 / alive;
    c.beginPath();
    c.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    c.lineWidth = 3;

    if (this.human) c.strokeStyle = "red";

    c.moveTo(this.x, this.y + this.h / 2);
    c.lineTo(this.x + this.w, this.y);
    c.lineTo(this.x, this.y - this.h / 2);
    c.lineTo(this.x, this.y + this.h / 2);
    c.lineTo(this.x + this.w, this.y);
    c.stroke();
  }

  findOutput(outp) {
    if (outp[0] > 0.5 && outp[0] > outp[1]) this.dir = -1;
    else if (outp[1] > 0.5 && outp[1] > outp[0]) this.dir = 1;
    else this.dir = 0;
  }

  lost() {
    this.mitdabei = false;
    alive--;
    _Lebend.innerHTML = `Noch am Leben: ${alive} von ${N}`;
    scores.push(this.score);
  }
}

class Asteroid {
  constructor(i, lane) {
    this.r = Math.random() * (H / (2 * lanes) - 25) + 25;
    this.lane = lane;
    this.x = 2 * W + (2 * W * i) / astN;
    this.y = (this.lane * H) / lanes + H / (2 * lanes);

    this.vert = this.vertecies(Math.floor(Math.random() * 5 + 10));
  }

  vertecies(n) {
    let vs = [];
    for (let i = 0; i < n; i++) {
      let a = (Math.PI * 2 * i) / n;
      let off = this.r / 6;
      let xoff = Math.random() * 2 * off + off;
      let yoff = Math.random() * 2 * off + off;
      let x = this.r * Math.cos(a) + xoff;
      let y = this.r * Math.sin(a) + yoff;

      let v = {
        x: x,
        y: y,
      };

      vs.push(v);
    }

    return vs;
  }

  update() {
    this.x -= speed;

    this.collision();
    if (this.x + this.r < -this.r) this.respawn();

    this.show();
  }

  show() {
    c.beginPath();
    c.strokeStyle = "white";
    c.lineWidth = 5;
    c.moveTo(this.x + this.vert[0].x, this.y + this.vert[0].y);
    for (let i = 0; i < this.vert.length; i++) {
      c.lineTo(this.x + this.vert[i].x, this.y + this.vert[i].y);
    }
    c.lineTo(this.x + this.vert[0].x, this.y + this.vert[0].y);
    c.stroke();
  }

  collision() {
    rockets.forEach((r) => {
      if (
        Math.abs(r.y - this.y) < this.r &&
        this.x < r.x + r.w &&
        this.x + this.r > r.x &&
        r.mitdabei
      ) {
        r.lost();
      }
    });
  }

  respawn() {
    rockets.forEach((r) => {
      if (r.mitdabei) r.score++;
    });

    this.r = Math.random() * (H / (2 * lanes) - 50) + 25;
  
    let counter = 0;

    while (counter < 1000) {
      let weitgenugweg = true;
      this.x = 2 * W + W * Math.random();

      asteroids.forEach((a) => {
        if (Math.abs(this.x - a.x) < 350 && a.x !== this.x) weitgenugweg = false;
      });

      if (weitgenugweg) break;

      counter++;
    }

    this.vert = this.vertecies(Math.floor(Math.random() * 5 + 10));

    speed += inc;
    highest++;
    _Score.innerHTML = `Score: ${highest}`;
  }
}

Start();

document.addEventListener("keydown", (e) => {
  if (e.key == " ") cancelAnimationFrame(updater);
  if (e.key == "a") updater = requestAnimationFrame(Update);

  if ((e.key == "w" || e.key == "ArrowUp") && !player.changingLane) player.humanLane(-1);
  if ((e.key == "s" || e.key == "ArrowDown") && !player.changingLane) player.humanLane(1);
});
