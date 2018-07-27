'use strict';

const O = require('../framework');

const FOOD_PER_FRAME = 0;
const TICKS_PER_FRAME = 1e4;
const MAX_MOVES_PER_FRAME = 20;
const MAX_STACK_SIZE = 1e4;

class World{
  constructor(w, h){
    this.w = w;
    this.h = h;

    this.grid = new Grid(this, w, h);
    this.ents = [];
  }

  tick(){
    this.grid.tick();

    const {ents} = this;
    const len = ents.length;
    for(var i = 0; i !== len; i++)
      ents[i].tick();
  }

  draw(imgd){
    this.grid.draw(imgd);
    
    const {ents} = this;
    const len = ents.length;
    for(var i = 0; i !== len; i++)
      ents[i].draw(imgd);
  }

  addEnt(team, machine, x, y){
    var ent = new Entity(this, team, machine, x, y);
    this.ents.push(ent);
  }
};

class Grid{
  constructor(world, w, h){
    this.world = world;

    this.w = w;
    this.h = h;

    this.d = O.ca(h, y =>{
      return O.ca(w, x =>{
        return new Tile(0, 0);
      });
    });
  }

  tick(){
    var {w, h} = this;

    O.repeat(FOOD_PER_FRAME, () => {
      var d = this.get(O.rand(w), O.rand(h));

      if(d.team === 0 && d.val !== 255)
        d.val++;
    });
  }

  draw(imgd){
    this.iterate((x, y, d) => {
      imgd.setRgb(x, y, 0, 0, 0);
    });
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
    var {w, h} = this;

    for(var y = 0; y !== h; y++)
      for(var x = 0; x !== w; x++)
        func(x, y, this.get(x, y));
  }

  includes(x, y){
    return x >= 0 && x < this.w && y >= 0 && y < this.h;
  }
};

class Tile{
  constructor(team, val){
    this.team = team;
    this.val = val;
  }
};

class Entity{
  constructor(world, team, machine, x, y){
    this.world = world;

    this.team = team;
    this.machine = machine;

    this.x = x;
    this.y = y;

    this.val = 0;
    this.moves = 0;

    this.prepareMachine();
  }

  tick(){
    this.moves = 0;
    this.machineTick.next();
  }

  draw(imgd){
    var {x, y} = this;
    
    var r = 169;
    var g = 169;
    var b = 169;

    imgd.setRgb(x, y, r, g, b);
    imgd.setRgb(x, y - 1, r, g, b);
    imgd.setRgb(x - 1, y, r, g, b);
    imgd.setRgb(x, y + 1, r, g, b);
    imgd.setRgb(x + 1, y, r, g, b);
  }

  prepareMachine(){
    var {machine} = this;

    /*machine.addFunc(this.isFree.bind(this));
    machine.addFunc(this.collect.bind(this));
    machine.addFunc(this.put.bind(this));*/
    machine.addFunc(this.move.bind(this));

    this.machineTick = machine.start(MAX_STACK_SIZE, TICKS_PER_FRAME);
  }

  isFree(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var coords = this.getCoords(cbInfo);
    if(coords === null) return;

    return cbInfo.getIdent(0, 1);
  }

  collect(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;
    if(this.val === 255) return;

    this.world.grid.get(this.x, this.y).val--;
    this.val++;

    this.afterMove();
    return cbInfo.getIdent(0, 1);
  }

  put(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;
    if(this.val === 0) return;

    var d = this.world.grid.get(this.x, this.y);
    if(d.val === 255) return;

    if(d.team === 0){
      if(d.val === 0){
        d.team = this.team;
        d.val = 1;
      }else{
        d.val--;
      }
      this.val--;
    }else if(d.team === this.team){
      d.val++;
      this.val--;
    }else{
      return;
    }

    this.afterMove();
    return cbInfo.getIdent(0, 1);
  }

  move(cbInfo){
    if(!cbInfo.evald) return cbInfo.args;

    var coords = this.getCoords(cbInfo, 1);
    if(coords === null) return;
    var [x, y] = coords;

    this.x = x;
    this.y = y;

    this.afterMove();
    return cbInfo.getIdent(0, 1);
  }

  getCoords(cbInfo, requiredToBeFree){
    var z = cbInfo.getIdent(0, 0);

    var arg0 = cbInfo.getArg(0) !== z | 0;
    var arg1 = cbInfo.getArg(1) !== z | 0;

    var dir = (arg1 << 1) | arg0;
    var {x, y} = this;

    switch(dir){
      case 0: y--; break;
      case 1: x--; break;
      case 2: y++; break;
      case 3: x++; break;
    }

    var {grid} = this.world;
    if(!grid.includes(x, y)) return null;

    if(requiredToBeFree){
      var team = grid.get(x, y).team;
      if(team !== 0 && team !== this.team) return null;
    }

    return [x, y];
  }

  afterMove(){
    if(++this.moves === MAX_MOVES_PER_FRAME)
      this.machine.pause();
  }
};

World.Grid = Grid;
World.Tile = Tile;
World.Entity = Entity;

module.exports = World;