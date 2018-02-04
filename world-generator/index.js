'use strict';

var PseudoRandomGenerator = require('../pseudo-random-generator');
var probs = require('./probabilities.json');

class WorldGenerator{
  constructor(mainSeed, landSize){
    this.mainSeed = mainSeed;
    this.landSize = landSize;
    
    this.gen = new PseudoRandomGenerator(mainSeed);
  }

  getTile(x, y){
    if(this.isWall(x, y)) return 0;
    return this.getLand(x, y);
  }

  getLand(x, y){
    this.gen.setSeed([Math.floor(x / this.landSize), Math.floor(y / this.landSize)]);
    return this.gen.rand(3) + 1;
  }

  isWall(x, y){
    var bx = !((x + 1) % this.landSize);
    var by = !((y + 1) % this.landSize);

    if(!(bx || by)) return false;
    var removeWall = false;

    if(!(bx && by)){
      this.gen.setSeed([x, y]);
      removeWall = !this.gen.rand(probs.removeWall);
    }

    var land = this.getLand(x, y);
    if(bx && by && this.getLand(x + 1, y + 1) != land) return true;
    if(removeWall) return false;

    if(bx && this.getLand(x + 1, y) != land) return true;
    if(by && this.getLand(x, y + 1) != land) return true;

    return false;
  }
};

module.exports = WorldGenerator;