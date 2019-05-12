'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');
const SF = require('../stack-frame');

class Function extends SF{
  static ptrsNum = this.keys(['script', 'name', 'prevFunc']);

  constructor(g, script=null, name=null){
    super(g);
    if(g.dsr) return;

    this.script = script;
    this.name = name;
    this.prevFunc = null;
  }

  get isFunc(){ return 1; }
}

module.exports = Function;

const cgs = require('.');