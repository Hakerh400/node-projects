'use strict';

const O = require('../framework');

class Entity{
  constructor(){
  }

  tick(){
  }

  draw(){
    var {w, h, g} = this.world;
  }
};

module.exports = Entity;