'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var media = require('../media');
var conv = require('../color-converter');

const ENTS_NUM = 100;
const DIAMETER = .75;
const SPEED_MIN = .05;
const SPEED_MAX = .1;

const RADIUS = DIAMETER / 2;

var cwd = __dirname;
var gridFile = path.join(cwd, 'grid.txt');

var w = 1920;
var h = 1080;
var fps = 60;
var fast = 0;

var duration = 60 * 60;
var framesNum = fps * duration;

var s = 40;
var [ws, hs] = [w, h].map(a => a / s | 0);
var [ws1, hs1] = [ws, hs].map(a => a - 1);

var cols = {
  bg: conv.color('darkgray'),
  wall: conv.color('#808080'),
  visited: conv.color('#ffff80'),
};

setTimeout(main);

function main(){
  var world;

  media.renderVideo('-vid/2.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      world = createWorld(g);
    }

    world.draw();
    world.tick();

    return f !== framesNum;
  });
}

function createWorld(g){
  g = new O.EnhancedRenderingContext(g);

  var grid = createGrid();
  var ents = createEnts();

  return new World(grid, ents, g);
}

function createGrid(){
  var gridStr = fs.readFileSync(gridFile, 'utf8');

  var gridData = gridStr.split(/\r\n|\r|\n/).map(row => {
    return row.split('').map(d => {
      return d === '#' ? 1 : 0;
    });
  });

  var grid = new Grid(ws, hs, (x, y) => {
    var wall = gridData[y][x];
    var visited = x === 1 && y === 1;

    return new Tile(wall, visited);
  });

  return grid;
}

function createEnts(){
  var ents = O.ca(ENTS_NUM, i => {
    var x = 1.5;
    var y = 1.5;
    var speed = SPEED_MIN + O.randf(SPEED_MAX - SPEED_MIN);
    var dir = O.rand(2) ? 2 : 3;
    var col = O.Color.from(O.hsv(O.randf(1)));

    return new Entity(x, y, speed, dir, col);
  });

  return ents;
}

class World{
  constructor(grid, ents, g){
    this.grid = grid;
    this.ents = ents;
    this.g = g;

    grid.world = this;
    ents.forEach(ent => ent.world = this);
  }

  tick(){
    var {grid, ents} = this;

    grid.tick();
    ents.forEach(ent => ent.tick());
  }

  draw(){
    var {grid, ents, g} = this;

    g.fillStyle = cols.bg;
    g.fillRect(0, 0, w, h);

    g.scale(s, s);
    grid.draw(g);
    ents.forEach(ent => ent.draw(g));
    g.resetTransform();
  }
};

class Grid{
  constructor(w, h, func=O.nop){
    this.world = null;

    this.w = w;
    this.h = h;

    this.d = O.ca(h, y => {
      return O.ca(w, x => {
        return func(x, y);
      });
    });
  }

  includes(x, y){
    return x >= 0 && x < this.w && y >= 0 && y < this.h;
  }

  get(x, y){
    if(!this.includes(x, y)) return null;
    return this.d[y][x];
  }

  set(x, y, val){
    if(!this.includes(x, y)) return;
    this.d[y][x] = val;
  }

  iterate(func){
    var {w, h, d} = this;

    for(var y = 0; y < h; y++){
      var row = d[y];
      for(var x = 0; x < w; x++)
        func(x, y, row[x]);
    }
  }

  tick(){}

  draw(g){
    this.drawTiles(g);
    this.drawFrames(g);
  }

  drawTiles(g){
    this.iterate((x, y, d) => {
      if(d.wall) g.fillStyle = cols.wall;
      else if(d.visited) g.fillStyle = cols.visited;
      else g.fillStyle = cols.bg;

      g.fillRect(x, y, 1, 1);
    });
  }

  drawFrames(g){
    this.iterate((x, y, d) => {
      if(d.wall){
        g.beginPath();
        g.rect(x, y, 1, 1);
        g.stroke();
      }
    });
  }
};

class Tile{
  constructor(wall, visited){
    this.wall = wall | 0;
    this.visited = visited | 0;
  }
};

class Entity extends O.Vector{
  constructor(x, y, speed, dir, col){
    super(x, y);

    this.world = null;

    this.speed = speed;
    this.dir = dir;
    this.col = col;

    this.pathDist = 0;
  }

  tick(){
    var {world, speed} = this;
    var {grid, ents} = world;

    var dx = 0;
    var dy = 0;

    switch(this.dir){
      case 0: dy = -1; break;
      case 1: dx = -1; break;
      case 2: dy = 1; break;
      case 3: dx = 1; break;
    }

    this.add(dx * speed, dy * speed);
    this.pathDist += speed;

    if(this.pathDist > 1){
      if(grid.get(Math.floor(this.x + dx), Math.floor(this.y + dy)).wall){
        var dirs = [];

        if(!grid.get(Math.floor(this.x), Math.floor(this.y - 1)).wall) dirs.push(0);
        if(!grid.get(Math.floor(this.x - 1), Math.floor(this.y)).wall) dirs.push(1);
        if(!grid.get(Math.floor(this.x), Math.floor(this.y + 1)).wall) dirs.push(2);
        if(!grid.get(Math.floor(this.x + 1), Math.floor(this.y)).wall) dirs.push(3);

        this.dir = O.randElem(dirs);
        this.x = Math.floor(this.x) + .5;
        this.y = Math.floor(this.y) + .5;
        this.pathDist = 0;
      }else{
        this.pathDist -= 1;
      }
    }

    var d = grid.get(Math.floor(this.x), Math.floor(this.y));
    d.visited = 1;
  }

  draw(g){
    var {x, y, col} = this;

    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, RADIUS, 0, O.pi2);
    g.fill();
    g.stroke();
  }
};