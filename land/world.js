'use strict';

const O = require('../framework');
const Grid = require('./grid');
const Entity = require('./entity');

class World{
  constructor(w, h, s, g){
    this.w = w;
    this.h = h;
    this.s = s;
    this.g = g;

    this.ws = w / s | 0;
    this.hs = h / s | 0;

    this.grid = new Grid(this);
    this.ents = [];
  }

  tick(){
    this.grid.tick();
    this.ents.forEach(ent => ent.tick());
  }

  draw(){
    var {w, h, g} = this;

    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);

    this.grid.draw();
    this.ents.forEach(ent => ent.draw());
  }
};

module.exports = World;