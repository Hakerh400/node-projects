'use strict';

var O = require('../framework');

var id = 0;

class Entity extends O.Vector{
  constructor(g, ents, x, y, radius, dir, speed){
    super(x, y);

    this.id = id++;

    this.w = g.canvas.width;
    this.h = g.canvas.height;
    this.g = g;
    this.ents = ents;

    this.radius = radius;
    this.diameter = this.radius * 2;
    this.mass = this.radius ** 2;
    this.dir = normalizeDir(dir);
    this.speed = O.Vector.prototype.fromAngle(speed, dir);

    this.calcBounds();
  }

  calcBounds(){
    this.xMin = this.radius;
    this.yMin = this.radius;
    this.xMax = this.w - this.radius - 1;
    this.yMax = this.h - this.radius - 1;
  }

  distEnt(ent){
    return this.dist(ent) - this.radius - ent.radius;
  }

  draw(){
    var g = this.g;

    g.translate(this.x, this.y);
    g.scale(this.radius, this.radius);
    g.rotate(this.dir);

    g.lineWidth = 1 / this.radius;

    g.fillStyle = 'red';
    drawCirc(g, 0, 0, 1);

    g.resetTransform();
  }

  tick(){
    this.calcCollisions();
    this.add(this.speed);

    if(this.x < this.xMin) this.x = this.xMin, this.speed.x *= -.99;
    else if(this.x > this.xMax) this.x = this.xMax, this.speed.x *= -.99;
    if(this.y < this.yMin) this.y = this.yMin, this.speed.y *= -.99;
    else if(this.y > this.yMax) this.y = this.yMax, this.speed.y *= -.99;
  }

  calcCollisions(){
    this.ents.forEach(ent => {
      if(!(ent.id < this.id))
        return;

      var dist = this.distEnt(ent);
      if(dist > 0)
        return;

      this.collide(ent, true);
    });
  }

  collide(ent, callBack = false){
    var speed = this.speed;
    var angle = Math.atan2(ent.y - this.y, ent.x - this.x);

    speed.rotate(-angle);

    if(speed.x > 0){
      var m = Math.min(this.mass / ent.mass, 1);
      var lostSpeed = speed.x * m;

      speed.x = lostSpeed - speed.x;
      ent.speed.combine(lostSpeed, angle);
    }

    speed.rotate(angle);

    if(callBack)
      ent.collide(this);
  }
};

module.exports = Entity;

function drawCirc(g, x, y, radius){
  g.beginPath();
  g.arc(x, y, radius, 0, O.pi2);
  g.fill();
  g.stroke();
}

function normalizeDir(dir){
  if(dir >= 0) return (dir + O.pi) % O.pi2 - O.pi;
  else return O.pi - (O.pi - dir) % O.pi2;
}