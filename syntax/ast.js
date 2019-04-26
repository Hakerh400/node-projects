'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class AST{
  constructor(str){
    this.str = str;
  }
};

class ASTNode{
  constructor(parent, ref, index){
    this.parent = parent;
    this.ast = parent !== null ? parent.ast : null;
    this.ref = ref;
    this.index = index;

    this.len = -1;
    this.leftRec = 0;
    this.done = 0;
  }
};

class ASTDef extends ASTNode{
  constructor(parent, ref, index){
    super(parent, ref, index);

    this.pats = [];
    this.patIndex = 0;
  }
};

class ASTPat extends ASTNode{
  constructor(parent, ref, index){
    super(parent, ref, index);

    this.elems = [];
    this.elemIndex = 0;
  }
};

class ASTElem extends ASTNode{
  constructor(parent, ref, index){
    super(parent, ref, index);
  }
};

class ASTNterm extends ASTElem{
  constructor(parent, ref, index){
    super(parent, ref, index);
  }
};

class ASTTerm extends ASTElem{
  constructor(parent, ref, index, len){
    super(parent, ref, index);

    this.len = len;
    this.done = 1;
  }
};

AST.ASTNode = ASTNode;
AST.ASTDef = ASTDef;
AST.ASTPat = ASTPat;
AST.ASTElem = ASTElem;
AST.ASTNterm = ASTNterm;
AST.ASTTerm = ASTTerm;

module.exports = AST;