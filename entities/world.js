'use strict';

var fs = require('fs');
var O = require('../framework');
var assembler = require('../assembler');
var formatNumber = require('../format-number');
var colorConverter = require('../color-converter');
var cols = require('./colors.json');
var clans = require('./clans.json');
var prices = require('./prices.json');

const SQRT3 = Math.sqrt(3);
const EYE_RADIUS = SQRT3 / 8;
const EYE_POSITION = SQRT3 / 5;
const EYE_PUPIL_RADIUS = SQRT3 / 20;
const EYE_PUPIL_POSITION = .5 + EYE_RADIUS - EYE_PUPIL_RADIUS;

var assemblyFile = './assembly.txt';

var tileParams = [
  'clan',
];

class World{
  constructor(g, tileSize){
    if(!(g instanceof O.EnhancedRenderingContext))
      g = new O.EnhancedRenderingContext(g);

    this.entsStaticId = 0;

    this.tileSize = tileSize;
    this.iw = g.canvas.width;
    this.ih = g.canvas.height;
    this.w = this.iw / tileSize | 0;
    this.h = this.ih / tileSize | 0;

    this.g = g;

    this.initGrid();
    this.initEnts();
  }

  initGrid(){
    this.grid = new O.TilesGrid(this.g);
    var grid = this.grid;

    grid.setTileParams(tileParams);
    grid.setWH(this.w, this.h);
    grid.setSize(this.tileSize);

    grid.create(this.gridCreateFunc.bind(this));
    grid.setDrawFunc(this.gridDrawFunc.bind(this));

    this.get = grid.get.bind(grid);
  }

  initEnts(){
    this.ents = [];
  }

  draw(f){
    var {g, iw, ih, grid, ents} = this;

    grid.resize();
    grid.draw();

    for(var i = 0; i < ents.length; i++){
      ents[i].draw(f);
    }

    this.drawClans(g.g);
  }

  tick(f){
    var {ents} = this;

    var startIndex = (f - 1) % ents.length;
    var endIndex = (startIndex + ents.length - 1) % ents.length;

    for(var i = startIndex; ; i = i !== ents.length - 1 ? i + 1 : 0){
      ents[i].tick(f);
      if(i === endIndex) break;
    }
  }

  drawClans(g){
    g.resetTransform();

    g.fillStyle = 'white';
    g.lineWidth = 2;
    g.beginPath();
    g.rect(-FONT_OFFSET, -FONT_OFFSET - .5, CAPTION_BOX_WIDTH + FONT_OFFSET, CAPTION_BOX_HEIGHT + FONT_OFFSET);
    g.fill();
    g.stroke();

    g.textBaseline = 'top';
    g.textAlign = 'left';
    g.font = `bold ${FONT_SIZE}px arial`;
    g.fillStyle = cols.text;

    clans.forEach((clan, index) => {
      var name = clan.name;
      var points = formatNumber(clan.points);

      var str = `${name}: ${points}`;

      g.fillText(str, FONT_OFFSET, FONT_OFFSET + FONT_SIZE * index);
    });

    g.textBaseline = 'middle';
    g.textAlign = 'center';
  }

  gridCreateFunc(x, y){
    return [-1];
  }

  gridDrawFunc(x, y, d, g){
    var {grid} = this;

    if(d.clan !== -1) g.fillStyle = clans[d.clan].col;
    else g.fillStyle = cols.bg;
    g.fillRect(x, y, 1, 1);

    grid.drawFrame(x, y);
  }
};

class Entity extends O.Vector{
  constructor(world, x, y, radius, dir){
    super(x, y);

    this.world = world;
    this.id = this.world.entsStaticId++;

    this.g = this.world.g;
    this.w = this.g.canvas.width;
    this.h = this.g.canvas.height;

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

    this.tick_(f);
  }

  draw(f){
    if(this.dead)
      return;

    var g = this.world.g.g;

    g.resetTransform();

    g.translate(this.x, this.y);
    g.scale(this.radius, this.radius);
    g.rotate(this.dir);

    g.lineWidth = 1 / this.radius;

    this.draw_(g, f);
  }

  buy(points){
    if(this.points < points)
      return false;

    this.points -= points;
    this.clan.points -= points;

    return true;
  }

  getTile(){
    var world = this.world;
    var tileSize = world.tileSize;

    var x = this.x / tileSize | 0;
    var y = this.y / tileSize | 0;

    return world.get(x, y);
  }

  setBlock(){
    var d = this.getTile();
    if(d.clan === this.clanId)
      return;

    if(!this.buy(prices.block))
      return;

    if(d.clan === -1) d.clan = this.clanId;
    else d.clan = -1;
  }

  removeBlock(){
    var d = this.getTile();
    if(d.clan === -1)
      return;

    d.clan = -1;
  }

  nearest(func){
    var ents = this.world.ents;
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
      this.world.ents.push(ent);
    });
  }

  die(){
    if(this.dead)
      return;

    this.dead = true;

    setTimeout(() => {
      this.children.forEach(child => child.parent = null);
      if(this.parent !== null) this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.world.ents.splice(this.world.ents.indexOf(this), 1);
    });
  }
};

class Player extends Entity{
  constructor(world, x, y, radius, dir, clanId, isBot = false){
    super(world, x, y, radius, dir);

    this.clanId = clanId;
    this.clan = clans[this.clanId];
    this.col = this.clan.col;
    this.targetDir = this.dir;
    this.speed = new O.Vector();
    this.isBot = isBot ? true : false;

    this.baseRadius = this.radius;
    this.points = 0;

    this.mutationTime = 0;
    this.paused = false;

    this.createMachine();
    this.updateRadius();
  }

  createMachine(){
    var machine = new assembler.Machine();

    if(this.isBot){
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
    var ent = new Player(this.g, this.world.ents, this.x, this.y, this.baseRadius, this.dir, this.clanId);

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
        var ents = this.world.ents.filter(ent => ent instanceof Player && !ent.dead && ent.clanId === this.clanId);
        var ent = ents[O.rand(ents.length)];

        ent.mutate();

        this.clan.mutated = true;
      }
    }else{
      this.clan.mutated = false;
    }

    this.paused = false;
    for(var i = 0; i < INSTRUCTIONS_PER_FRAME; i++){
      this.machine.tick();
      if(this.paused) break;
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

  draw_(g, f){
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

    switch(port % 0x05){
      case 0x00: val = this.x; break;
      case 0x01: val = this.y; break;
      case 0x02: val = this.dir; break;
      case 0x03: val = this.speed.len() / MAX_SPEED; break;
      case 0x04: val = this.direction(this.nearest(ent => ent instanceof Gem)); break;
    }

    this.machine.writef(val, port);
  }

  afterOut(val, port){
    if(isNaN(val) || Math.abs(val) === Infinity)
      return;

    switch(port % 0x03){
      case 0x00:
        this.targetDir = normalizeDir(val);
        break;

      case 0x01:
        var spNew = O.bound(val, 0, 1) * MAX_SPEED;
        this.speed.combine(spNew, this.dir).maxLen(MAX_SPEED);
        break;

      case 0x02:
        switch((val & 255) % 0x03){
          case 0x00: this.paused = true; break;
          case 0x01: this.setBlock(); break;
          case 0x02: this.removeBlock(); break;
        }
        break;
    }
  }

  setTargetDir(dir){
    this.targetDir = normalizeDir(dir);
  }

  calcCollisions(){
    this.world.ents.forEach(ent => {
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

    var ents = this.world.ents.filter(ent => ent instanceof Player && !ent.dead && ent.clanId === this.clanId && ent !== this);

    if(ents.length !== 0){
      var ent = ents[O.rand(ents.length)];

      ent.machine.mem.buff = Buffer.from(this.machine.mem.buff);
      ent.machine.resetRegs();
      ent.mutationTime = MUTATION_DISPLAY_TIME;
    }
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
  constructor(world, x, y, radius){
    super(world, x, y, radius, 0);

    this.col = cols.gem;
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

  draw_(g, f){
    g.fillStyle = this.col;
    drawCirc(g, 0, 0, 1);
  }

  tick_(f){
    if(this.isEaten(true))
      this.respawn();
  }
};

optimize();

module.exports = {
  clans,
  World,
  Player,
  Gem,
};

function optimize(){
  optimizeCols();
  optimizeClans();
}

function optimizeCols(){
  var keys = Object.getOwnPropertyNames(cols);

  keys.forEach(key => {
    var col = cols[key];
    cols[key] = colorConverter.normalize(col);
  });
}

function optimizeClans(){
  clans.forEach(clan => {
    var col = clan.col;
    clan.col = colorConverter.normalize(col);

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