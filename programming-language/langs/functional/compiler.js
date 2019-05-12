'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const CompilerBase = require('../../compiler-base');

class Compiler extends CompilerBase{
  static ptrsNum = this.keys(['idents']);

  constructor(g, ast){
    super(g, ast);
    if(g.dsr) return;

    this.idents = new cgs.Array(g);
  }

  getIdent(identName){
    const {g, idents} = this;

    const id = idents.findIndex(s => s[0].str === identName);
    if(id !== -1) return idents[id][1];

    const keyVal = new cgs.Array(this.g);
    keyVal.push(new cgs.String(this.g, identName));
    keyVal.push(new cs.Identifier(g, idents.length));
    idents.push(keyVal);

    return keyVal[1];
  }

  ['[script]'](e){
    this.idents = null;
    return e.elems[1].fst;
  }

  ['[list]'](e){
    return new cs.List(e.g, e.fst.arr);
  }

  ['[chain]'](e){
    return new cs.Chain(e.g, e.fst.arr);
  }

  ['[arg]'](e){
    if(e.patIndex === 0) return e.fst.fst;
    return e.elems[2].fst;
  }

  ['[ident]'](e){
    return this.getIdent(e.str);
  }
}

module.exports = Compiler;

const Parser = require('./parser');
const Interpreter = require('./interpreter');

const cs = Interpreter.ctorsObj;

Compiler.Parser = Parser;
Compiler.Interpreter = Interpreter;