'use strict';

var fs = require('fs');
var O = require('../framework');
var assembler = require('../assembler');
var colorConverter = require('../color-converter');
var clans = require('./clans.json');

const BOTS_ENABLED = 0;

const FPS = 60;
const INSTRUCTIONS_PER_FRAME = 100;
const MUTATION_INTERVAL = FPS * 10;
const MUTATION_FACTOR = .01;
const MUTATION_DISPLAY_TIME = FPS * 1;

const ROT_SPEED = O.pi * .1;
const FRICTION = .9;

const SQRT3 = Math.sqrt(3);
const EYE_RADIUS = SQRT3 / 8;
const EYE_POSITION = SQRT3 / 5;
const EYE_PUPIL_RADIUS = SQRT3 / 20;
const EYE_PUPIL_POSITION = .5 + EYE_RADIUS - EYE_PUPIL_RADIUS;

var assemblyFile = './assembly.txt';

var id = 0;

class Entity extends O.Vector{
  constructor(g, ents, x, y, radius, dir){
    super(x, y);

    this.id = id++;

    this.w = g.canvas.width;
    this.h = g.canvas.height;
    this.g = g;
    this.ents = ents;

    this.radius = radius;
    this.diameter = this.radius * 2;
    this.dir = normalizeDir(dir);

    this.parent = null;
    this.children = [];

    this.dead = false;
  }

  tick(f){
    if(this.dead)
      return;

    /*var playersNum = this.ents.reduce((val, ent) => {
      if(!(ent instanceof Player) || ent.dead) return val;
      return val + 1;
    }, 0);
    if(playersNum > 50 * 4){
      console.log('');
      console.log('playersNum:', playersNum);
      console.log('clanId:', this.clanId);
      console.log('clans:', clans.map((a,b)=>this.ents.filter(c=>!c.dead&&(c instanceof Player)&&c.clanId===b).length).join`,`);
      console.log('food:', ents.filter(a=>a instanceof Food).length);
      console.log('dead food:', ents.filter(a=>(a instanceof Food)&&a.dead).length);
      throw 0;
    }*/

    this.tick_(f);
  }

  draw(f){
    if(this.dead)
      return;

    var g = this.g;

    g.translate(this.x, this.y);
    g.scale(this.radius, this.radius);
    g.rotate(this.dir);

    g.lineWidth = 1 / this.radius;

    this.draw_(f);

    g.resetTransform();
  }

  nearest(func){
    var ents = this.ents;
    var len = ents.length;

    var ent = null;
    var minDist;

    for(var i = 0; i < len; i++){
      var e = ents[i];
      if(e.dead || e === this || !func(e))
        continue;

      var rr = this.radius + e.radius;
      var dx, dy;

      if(ent === null){
        ent = e;
        dx = this.x - e.x;
        dy = this.y - e.y;
        minDist = Math.sqrt(dx * dx + dy * dy) - rr;
        continue;
      }

      if((dx = Math.abs(this.x - e.x)) - rr > minDist)
        continue;

      if(dx + (dy = Math.abs(this.y - e.y)) - rr > minDist)
        continue;

      var dist = Math.sqrt(dx * dx + dy * dy) - rr;

      if(dist < minDist){
        ent = e;
        minDist = dist;
      }
    }

    return ent;
  }

  distEnt(ent){
    if(ent === null || ent.dead) return null;
    return this.dist(ent) - this.radius - ent.radius;
  }

  lookAt(x, y){
    if(x instanceof Entity)
      ({x, y} = x);

    var dir = Math.atan2(y - this.y, x - this.x);
    this.setTargetDir(dir);
  }

  direction(x, y){
    if(x === null)
      return 0;

    if(x instanceof Entity)
      ({x, y} = x);

    var dir = Math.atan2(y - this.y, x - this.x);
    return dir;
  }

  appendChild(ent){
    setTimeout(() => {
      ent.parent = this;
      this.children.push(ent);
      this.ents.push(ent);
    });
  }

  die(){
    if(this.dead)
      return;

    this.dead = true;

    setTimeout(() => {
      this.children.forEach(child => child.parent = null);
      if(this.parent !== null) this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.ents.splice(this.ents.indexOf(this), 1);
    });
  }
};

class Player extends Entity{
  constructor(g, ents, x, y, radius, dir, clanId){
    super(g, ents, x, y, radius, dir);

    this.clanId = clanId;
    this.clan = clans[this.clanId];
    this.col = this.clan.col;
    this.targetDir = this.dir;
    this.speed = new O.Vector();

    this.baseRadius = this.radius;
    this.points = 0;

    this.mutationTime = 0;

    this.createMachine();
    this.updateRadius();
  }

  createMachine(){
    var machine = new assembler.Machine();

    if(BOTS_ENABLED && this.clanId === 0){
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

  updateRadius(){
    //this.radius = this.baseRadius + this.points ** .3;
    this.updateMass();
    this.calcBounds();
  }

  updateMass(){
    this.mass = this.radius * this.radius;
  }

  calcBounds(){
    this.xMin = this.radius;
    this.yMin = this.radius;
    this.xMax = this.w - this.radius - 1;
    this.yMax = this.h - this.radius - 1;
    this.xMinB = this.xMin + CAPTION_BOX_WIDTH;
    this.yMinB = this.yMin + CAPTION_BOX_HEIGHT;
  }

  clone(){
    var ent = new Player(this.g, this.ents, this.x, this.y, this.baseRadius, this.dir, this.clanId);

    ent.machine.mem.buff = Buffer.from(this.machine.mem.buff);
    this.appendChild(ent);

    return ent;
  }

  tick_(f){
    if(this.mutationTime !== 0){
      this.mutationTime--;
    }

    if(f % MUTATION_INTERVAL === 0){
      if(!this.clan.mutated){
        var ents = this.ents.filter(ent => ent instanceof Player && !ent.dead && ent.clanId === this.clanId);
        var ent = ents[O.rand(ents.length)];

        ent.mutate();

        this.clan.mutated = true;
      }
    }else{
      this.clan.mutated = false;
    }

    for(var i = 0; i < INSTRUCTIONS_PER_FRAME; i++){
      this.machine.tick();
    }

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

    this.calcCollisions();

    this.speed.maxLen(MAX_SPEED);
    this.add(this.speed);
    this.speed.mul(FRICTION);

    this.boundCoords();
  }

  draw_(f){
    var g = this.g;

    g.fillStyle = this.col;
    drawCirc(g, 0, 0, 1);

    g.fillStyle = '#ffffff';
    drawCirc(g, .5, EYE_POSITION, EYE_RADIUS);
    drawCirc(g, .5, -EYE_POSITION, EYE_RADIUS);

    g.fillStyle = '#000000';
    drawCirc(g, EYE_PUPIL_POSITION, EYE_POSITION, EYE_PUPIL_RADIUS);
    drawCirc(g, EYE_PUPIL_POSITION, -EYE_POSITION, EYE_PUPIL_RADIUS);

    if(this.mutationTime !== 0){
      g.globalAlpha = this.mutationTime / MUTATION_DISPLAY_TIME;
      g.fillStyle = '#ffffff';
      drawCirc(g, 0, 0, 1);
      g.globalAlpha = 1;
    }
  }

  beforeIn(port){
    var val;

    switch(port % 0x0A){
      case 0x00: val = this.x; break;
      case 0x01: val = this.y; break;
      case 0x02: val = rad2deg(this.dir); break;
      case 0x03: val = this.speed.len() / MAX_SPEED * 255; break;
      case 0x04: val = this.distEnt(this.nearest(e => e instanceof Gem)); break;
      case 0x05: val = rad2deg(this.direction(this.nearest(e => e instanceof Gem))); break;
      case 0x06: val = this.distEnt(this.nearest(e => e instanceof Player && e.clan === this.clan)); break;
      case 0x07: val = rad2deg(this.direction(this.nearest(e => e instanceof Player && e.clan === this.clan))); break;
      case 0x08: val = this.distEnt(this.nearest(e => e instanceof Player && e.clan !== this.clan)); break;
      case 0x09: val = rad2deg(this.direction(this.nearest(e => e instanceof Player && e.clan !== this.clan))); break;
    }

    this.machine.write(Math.round(val), port);
  }

  afterOut(val, port){
    switch(port % 0x02){
      case 0x00: this.targetDir = deg2rad(val % 360); break;
      case 0x01:
        var spNew = (val & 255) / 255 * MAX_SPEED;
        this.speed.combine(spNew, this.dir).maxLen(MAX_SPEED);
        break;
    }
  }

  setTargetDir(dir){
    this.targetDir = normalizeDir(dir);
  }

  calcCollisions(){
    this.ents.forEach(ent => {
      if(!(ent instanceof Player) || ent.dead || ent.id >= this.id)
        return;

      var dist = this.distEnt(ent);
      if(dist > 0)
        return;

      this.collide(ent, true);
    });
  }

  collide(ent, callBack = false){
    var speed = this.speed;
    var dx = ent.x - this.x;
    var dy = ent.y - this.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.atan2(dy, dx);

    speed.rotate(-angle);

    if(speed.x > 0){
      var factor = this.mass < ent.mass ? this.mass / ent.mass : 1;
      var lostSpeed = speed.x * factor;

      speed.x = lostSpeed - speed.x;
      ent.speed.combine(lostSpeed, angle);
    }

    speed.rotate(angle);

    var dd = 1 - dist / (this.radius + ent.radius);
    this.x -= dx * dd;
    this.y -= dy * dd;

    if(callBack)
      ent.collide(this);
  }

  collectGem(){
    this.points++;
    this.clan.points++;
    this.updateRadius();

    var ents = this.ents.filter(ent => ent instanceof Player && !ent.dead && ent.clanId === this.clanId && ent !== this);
    var ent = ents[O.rand(ents.length)];

    ent.machine.mem.buff = Buffer.from(this.machine.mem.buff);
    ent.machine.resetRegs();

    ent.mutationTime = MUTATION_DISPLAY_TIME;
  }

  mutate(){
    this.mutationTime = MUTATION_DISPLAY_TIME;

    var buff = this.machine.mem.buff;
    var len = buff.length;
    var num = Math.round(len * MUTATION_FACTOR);

    for(var i = 0; i < num; i++){
      buff[O.rand(len)] = O.rand(256);
    }

    this.machine.resetRegs();
  }

  boundCoords(){
    var dx = this.xMinB - this.x;
    var dy = this.yMinB - this.y;

    if(dx > 0 && dy > 0){
      if(dx < dy) this.x = this.xMinB, this.speed.x = -this.speed.x;
      else this.y = this.yMinB, this.speed.y = -this.speed.y;
    }
    
    if(this.x < this.xMin) this.x = this.xMin, this.speed.x = -this.speed.x;
    else if(this.x > this.xMax) this.x = this.xMax, this.speed.x = -this.speed.x;
    if(this.y < this.yMin) this.y = this.yMin, this.speed.y = -this.speed.y;
    else if(this.y > this.yMax) this.y = this.yMax, this.speed.y = -this.speed.y;
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

      var dx = CAPTION_BOX_WIDTH + this.radius - this.x;
      var dy = CAPTION_BOX_HEIGHT + this.radius - this.y;
      var isInCapBox = dx > 0 && dy > 0;
    }while(isInCapBox || this.isEaten());
  }

  isEaten(givePoints = false){
    var ent = this.nearest(ent => ent instanceof Player);
    if(ent === null) return false;

    if(this.distEnt(ent) < 0){
      if(givePoints){
        ent.collectGem();
      }

      return true;
    }

    return false;
  }

  draw_(f){
    var g = this.g;

    g.fillStyle = this.col;
    drawCirc(g, 0, 0, 1);
  }

  tick_(f){
    if(this.isEaten(true))
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
    clan.mutated = false;
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