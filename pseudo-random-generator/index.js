'use strict';

var hash = require('../hash');

class PseudoRandomGenerator{
  constructor(mainSeed){
    this.setMainSeed(mainSeed);
  }

  setMainSeed(mainSeed){
    this.mainSeed = mainSeed;
    this.seed = '';
    this.index = 0;
  }

  setSeed(seed){
    this.seed = seed;
    this.index = 0;
  }

  rand(val){
    var buff = hash(this.getSeedStr());
    var num = buff.readUInt32LE(0);

    this.index++;
    
    return num % val;
  }

  getSeedStr(){
    return `${this.mainSeed}\x00${this.seed}\x00${this.index}`;
  }
};

module.exports = PseudoRandomGenerator;