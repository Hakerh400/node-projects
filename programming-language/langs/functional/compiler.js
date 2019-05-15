'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const CompilerBase = require('../../compiler-base');

class Compiler extends CompilerBase{
  constructor(g, ast){
    super(g, ast);
    if(g.dsr) return;
  }

  ['[script]'](e){
    return e.elems[1].fst;
  }

  ['[list]'](e){
    return new cs.List(e.g, e.fst.arr);
  }

  ['[chain]'](e){
    return new cs.Chain(e.g, e.fst.fst, e.elems[2].arr);
  }

  ['[arg]'](e){
    const {g} = this;
    if(e.patIndex === 0)
      return new cs.List(g, cgs.Array.from(g, [e.fst.fst]));
    return e.elems[2].fst;
  }

  ['[ident]'](e){
    const {g} = this;
    const str = new cgs.String(g, String(e));
    return new cs.Identifier(g, str);
  }
}

module.exports = Compiler;

const Parser = require('./parser');
const Interpreter = require('./interpreter');

const cs = Interpreter.ctorsObj;

Compiler.Parser = Parser;
Compiler.Interpreter = Interpreter;