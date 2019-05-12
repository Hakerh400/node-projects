'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');

class Script extends SG.Node{
  static ptrsNum = this.keys(['source', 'file']);

  constructor(g, source=null, file=null){
    super(g);
    if(g.dsr) return;

    this.source = source;
    this.file = file;
  }
}

module.exports = Script;

const cgs = require('.');