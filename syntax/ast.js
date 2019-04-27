'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class AST{
  constructor(syntax, str){
    this.syntax = syntax;
    this.str = str;

    this.node = null;
  }

  compile(funcs){
    return this.syntax.compile(this, funcs);
  }
};

class ASTNode{
  constructor(ast, index, ref){
    this.ast = ast;
    this.index = index
    this.ref = ref;

    this.len = -1;
    this.done = 0;
    this.parent = null;
  }

  get end(){ return this.index + this.len; }

  reset(){ O.virtual('reset'); }
  update(){ O.virtual('update'); }

  finalize(){
    this.done = 1;
    return this;
  }

  toString(){
    return this.ast.str.slice(this.index, this.end);
  }
};

class ASTDef extends ASTNode{
  constructor(ast, index, ref){
    super(ast, index, ref);

    this.pats = [];
    this.pat = null;
    this.patIndex = 0;
    this.elems = null;
  }

  get fst(){ return this.elems[0]; }

  reset(){
    this.pats.length = 0;
    this.pat = null;
    this.patIndex = 0;

    return this;
  }

  update(){
    const {pats} = this;

    let len = -1;
    let patIndex = 0;
    let done = 1;

    for(let i = 0; i !== pats.length; i++){
      const pat = pats[i];
      if(!pat.done) done = 0;
      if(pat.len <= len) continue;

      len = pat.len;
      patIndex = i;
    }

    this.len = len;
    this.patIndex = patIndex;
    this.done = done;

    this.pat = this.pats[patIndex];
    this.pats = null;
    this.elems = this.pat.elems;

    return this;
  }
};

class ASTPat extends ASTNode{
  constructor(ast, index, ref){
    super(ast, index, ref);

    this.elems = [];
  }

  get fst(){ return this.elems[0]; }

  reset(){
    this.elems.length = 0;

    return this;
  }

  update(){
    const {elems} = this;

    let len = 0;
    let done = 1;

    for(let i = 0; i !== elems.length; i++){
      const elem = elems[i];
      if(!elem.done) done = 0;
      if(elem.len === -1) throw new TypeError('This should not happen');

      len += elem.len;
    }

    this.len = len;
    this.done = done;

    return this;
  }
};

class ASTElem extends ASTNode{
  constructor(ast, index, ref){
    super(ast, index, ref);

    this.arr = [];
    this.seps = [];
  }

  get fst(){ return this.arr[0]; }

  reset(){
    this.arr.length = 0;
    this.seps.length = 0;

    return this;
  }
};

class ASTNterm extends ASTElem{
  constructor(ast, index, ref){
    super(ast, index, ref);
  }

  update(){
    const {arr, seps} = this;
    const fDone = e => e.done;

    this.len = arr.reduce((n, e) => n + e.len, 0);
    this.done = arr.every(fDone) && seps.every(fDone);

    return this;
  }
};

class ASTTerm extends ASTElem{
  constructor(ast, index, ref){
    super(ast, index, ref);
  }

  update(){
    const {arr, seps} = this;

    this.len = arr.reduce((n, s) => n + s.length, 0);
    this.done = 1;

    return this;
  }
};

AST.ASTNode = ASTNode;
AST.ASTDef = ASTDef;
AST.ASTPat = ASTPat;
AST.ASTElem = ASTElem;
AST.ASTNterm = ASTNterm;
AST.ASTTerm = ASTTerm;

module.exports = AST;