'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');

class Compiler extends SF{
  constructor(g, ast){
    super(g);
    if(g.dsr) return;

    this.ast = ast;
  }
}

class Compile extends SF{
  static ptrsNum = 4;

  constructor(g, compiler, elem){
    super(g);
    if(g.dsr) return;

    this.elem = elem;
  }

  get compiler(){ return this[2]; } set compiler(a){ this[2] = a; }
  get elem(){ return this[3]; } set elem(a){ this[3] = a; }
};

class CompileDef extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }
};

class CompileArr extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }
};

module.exports = Object.assign(Compiler, {
  Compile,
  CompileDef,
  CompileArr,
});