'use strict';

const O = require('../framework');

class Biome{
  constructor(id){
    this.id = id;
  }
};

const biomes = [
  // 0
  new Biome()
];

biomes.Biome = Biome;

module.exports = biomes;