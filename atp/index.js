'use strict';

const O = require('../framework');
const LogicalSystem = require('./logical-system.js');

class Prover{
  constructor(system){
    this.system = system;
  }

  static from(str){
    var system = LogicalSystem.from(str);
    return new Prover(system);
  }
};

module.exports = Prover;