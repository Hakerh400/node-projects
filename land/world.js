'use strict';

const O = require('../framework');
const Grid = require('./grid');
const Entity = require('./entity');

class World{
  constructor(){
    this.grid = new Grid(this);
    this.ents = [];
  }

  tick(){
    this.grid.tick();
    this.ents.forEach(ent => ent.tick());
  }

  draw(imgd){
    this.grid.draw(imgd);
    this.ents.forEach(ent => ent.draw(imgd));
  }
};

module.exports = World;