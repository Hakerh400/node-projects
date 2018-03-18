'use strict';

var fs = require('fs');
var O = require('../framework');
var assembler = require('../assembler');
var colorConverter = require('../color-converter');
var clans = require('./clans.json');

const SQRT3 = Math.sqrt(3);
const EYE_RADIUS = SQRT3 / 8;
const EYE_POSITION = SQRT3 / 5;
const EYE_PUPIL_RADIUS = SQRT3 / 20;
const EYE_PUPIL_POSITION = .5 + EYE_RADIUS - EYE_PUPIL_RADIUS;

const MAX_SPEED = 3;
const ROT_SPEED = O.pi * .1;
const FRICTION = .99;

const INSTRUCTIONS_PER_FRAME = 100;

var assemblyFile = './assembly.txt';

var id = 0;

class Entity{
  constructor(g, ents, x, y, radius, dir){
    this.id = id++;

    this.w = g.canvas.width;
    this.h = g.canvas.height;
    this.g = g;
    this.ents = ents;

    this.x = x;
    this.y = y;
    this.radius = radius;
    this.diameter = this.radius * 2;
    this.dir = normalizeDir(dir);
  }

  draw(){
    var g = this.g;

    g.translate(this.x, this.y);
    g.scale(this.radius, this.radius);
    g.rotate(-this.dir);

    g.lineWidth = 1 / this.radius;

    this.draw_();

    g.resetTransform();
  }

  tick(){
    this.tick_();
  }

  lookAt(x, y){
    if(x === null)
      return 0;

    if(x instanceof Entity){
      var ent = x;
      x = ent.x;
      y = ent.y;
    }

    var dx = x - this.x;
    var dy = y - this.y;
    var dir = Math.atan2(-dy, dx);

    this.rotate(dir);
  }

  nearest(func){
    var ents = this.ents;
    var len = ents.length;

    var ent = null;
    var minDist;

    for(var i = 0; i < len; i++){
      var e = ents[i];

      if(e === this || !func(e))
        continue;

      var dist = Math.hypot(this.x - e.x, this.y - e.y);

      if(ent === null || dist < minDist){
        ent = e;
        minDist = dist;
      }
    }

    return ent;
  }

  dist(x, y){
    if(x === null)
      return 0;

    if(x instanceof Entity){
      var ent = x;
      x = ent.x;
      y = ent.y;
    }

    var dx = x - this.x;
    var dy = y - this.y;
    var dist = Math.hypot(dx, dy);

    return dist;
  }

  direction(x, y){
    if(x === null)
      return 0;

    if(x instanceof Entity){
      var ent = x;
      x = ent.x;
      y = ent.y;
    }

    var dx = x - this.x;
    var dy = y - this.y;
    var dir = Math.atan2(-dy, dx);

    return dir;
  }
};

class Player extends Entity{
  constructor(g, ents, x, y, radius, dir, speed, clan){
    super(g, ents, x, y, radius, dir);

    this.clan = clans[clan];
    this.col = this.clan.col;
    this.targetDir = this.dir;
    this.speed = speed;

    this.createMachine();
    this.calcBounds();
  }

  createMachine(){
    var machine = new assembler.Machine();

    if(this.id === 0){
      var assembly = fs.readFileSync(assemblyFile);
      machine.compile(assembly);
    }else{
      var buff = machine.mem.buff;
      for(var i = 0; i < buff.length; i++){
        buff[i] = O.rand(256);
      }
    }

    machine.ignoreErrors = true;
    machine.beforeIn = this.beforeIn.bind(this);
    machine.afterOut = this.afterOut.bind(this);

    this.machine = machine;
  }

  calcBounds(){
    this.xMin = this.radius;
    this.yMin = this.radius;
    this.xMax = this.w - this.radius - 1;
    this.yMax = this.h - this.radius - 1;
  }

  tick_(){
    for(var i = 0; i < INSTRUCTIONS_PER_FRAME; i++){
      this.machine.tick();
    }

    if(this.speed > MAX_SPEED)
      this.speed = MAX_SPEED;

    this.speed *= FRICTION;

    if(this.dir !== this.targetDir){
      var diff = angleDiff(this.targetDir, this.dir);

      if(Math.abs(diff) < ROT_SPEED){
        this.dir = this.targetDir;
      }else{
        if(diff > 0) this.dir += ROT_SPEED;
        else this.dir -= ROT_SPEED;

        this.dir = normalizeDir(this.dir);
      }
    }

    var m = this.x;

    this.x += Math.cos(this.dir) * this.speed;
    this.y -= Math.sin(this.dir) * this.speed;

    if(this.x < this.xMin) this.x = this.xMin;
    else if(this.x > this.xMax) this.x = this.xMax;
    if(this.y < this.yMin) this.y = this.yMin;
    else if(this.y > this.yMax) this.y = this.yMax;
  }

  draw_(){
    var g = this.g;

    g.fillStyle = this.col;
    drawCirc(g, 0, 0, 1);

    g.fillStyle = '#ffffff';
    drawCirc(g, .5, EYE_POSITION, EYE_RADIUS);
    drawCirc(g, .5, -EYE_POSITION, EYE_RADIUS);

    g.fillStyle = '#000000';
    drawCirc(g, EYE_PUPIL_POSITION, EYE_POSITION, EYE_PUPIL_RADIUS);
    drawCirc(g, EYE_PUPIL_POSITION, -EYE_POSITION, EYE_PUPIL_RADIUS);
  }

  beforeIn(port){
    var val;

    switch(port % 0x0A){
      case 0x00: val = this.x; break;
      case 0x01: val = this.y; break;
      case 0x02: val = rad2deg(this.dir); break;
      case 0x03: val = this.speed / MAX_SPEED * 255; break;
      case 0x04: val = this.dist(this.nearest(e => e instanceof Gem)); break;
      case 0x05: val = rad2deg(this.direction(this.nearest(e => e instanceof Gem))); break;
      case 0x06: val = this.dist(this.nearest(e => e instanceof Player && e.clan === this.clan)); break;
      case 0x07: val = rad2deg(this.direction(this.nearest(e => e instanceof Player && e.clan === this.clan))); break;
      case 0x08: val = this.dist(this.nearest(e => e instanceof Player && e.clan !== this.clan)); break;
      case 0x09: val = rad2deg(this.direction(this.nearest(e => e instanceof Player && e.clan !== this.clan))); break;
    }

    this.machine.write(Math.round(val), port);
  }

  afterOut(val, port){
    switch(port % 0x02){
      case 0x00: this.targetDir = deg2rad(val % 360); break;
      case 0x01: this.speed = (val & 255) / 255 * MAX_SPEED; break;
    }
  }

  rotate(dir){
    this.targetDir = normalizeDir(dir);
  }

  collectGem(){
    this.points++;
    this.clan.points++;
  }
};

class Gem extends Entity{
  constructor(g, ents, x, y, radius){
    super(g, ents, x, y, radius, 0);

    this.col = '#ffff00';
  }

  respawn(){
    do{
      this.x = this.radius + O.randf(this.w - this.diameter - 1);
      this.y = this.radius + O.randf(this.h - this.diameter - 1);
    }while(this.isEaten(0));
  }

  isEaten(givePoints){
    var ent = this.nearest(ent => ent instanceof Player);
    if(ent === null) return 0;

    if(this.dist(ent) < this.radius + ent.radius){
      if(givePoints){
        ent.collectGem();
      }

      return 1;
    }

    return 0;
  }

  draw_(){
    var g = this.g;

    g.fillStyle = this.col;
    drawCirc(g, 0, 0, 1);
  }

  tick_(){
    if(this.isEaten(1))
      this.respawn();
  }
};

initClans();

module.exports = {
  Player,
  Gem,
  clans,
};

function initClans(){
  clans.forEach(clan => {
    clan.points = 0;
  });
}

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

function angleDiff(target, dir){
  var diff = target - dir;

  if(diff > O.pi) diff -= O.pi2;
  else if(diff < -O.pi) diff += O.pi2

  return diff;
}

function rad2deg(rad){
  return (rad + O.pi2) / O.pi2 % 1 * 360;
}

function deg2rad(deg){
  return normalizeDir(deg / 360 * O.pi2);
}