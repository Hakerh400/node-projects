'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const Element = require('./element');

class AST extends SG.Node{
  static ptrsNum = 3;

  constructor(graph, syntax=null, str=null, node=null){
    super(graph);
    if(graph.dsr) return;

    this.syntax = syntax;
    this.str = str;
    this.node = node;
  }

  get syntax(){ return this[0]; } set syntax(a){ this[0] = a; }
  get str(){ return this[1]; } set str(a){ this[1] = a; }
  get node(){ return this[2]; } set node(a){ this[2] = a; }
};

class ASTNode extends SG.Node{
  static ptrsNum = 2;

  constructor(graph, ast=null, index=0, ref=null){
    super(graph);
    if(graph.dsr) return;

    this.ast = ast;
    this.ref = ref;
    this.index = index
    this.len = -1;
    this.done = 0;
  }

  ser(ser=new O.Serializer()){
    return ser.writeUint(this.index).writeInt(this.len).write(this.done);
  }

  deser(ser){
    this.index = ser.readUint();
    this.len = ser.readInt();
    this.done = ser.read();
    return this;
  }

  get ast(){ return this[0]; } set ast(a){ this[0] = a; }
  get ref(){ return this[1]; } set ref(a){ this[1] = a; }

  get end(){ return this.index + this.len; }
  get str(){ return this.toString(); }

  reset(){ O.virtual('reset'); }
  update(){ O.virtual('update'); }

  finalize(){
    this.done = 1;
    return this;
  }

  toString(){
    return this.ast.str.str.slice(this.index, this.end);
  }
};

class ASTDef extends ASTNode{
  static ptrsNum = 5;

  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;

    this.pats = new SG.Array(this.graph);
    this.pat = null;
    this.elems = null;
    this.patIndex = 0;
  }

  ser(ser=new O.Serializer()){
    return super.ser(ser).writeUint(this.index).writeInt(this.len).write(this.done);
  }

  deser(ser){
    super.deser(ser);
    this.index = ser.readUint();
    this.len = ser.readInt();
    this.done = ser.read();
    return this;
  }

  get pats(){ return this[2]; } set pats(a){ this[2] = a; }
  get pat(){ return this[3]; } set pat(a){ this[3] = a; }
  get elems(){ return this[4]; } set elems(a){ this[4] = a; }
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
  static ptrsNum = 3;

  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;

    this.elems = new SG.Array(this.graph);
  }

  get elems(){ return this[2]; } set elems(a){ this[2] = a; }
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
  static ptrsNum = 4;

  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;

    this.arr = new SG.Array(this.graph);
    this.seps = new SG.Array(this.graph);
  }

  get arr(){ return this[2]; } set arr(a){ this[2] = a; }
  get seps(){ return this[3]; } set seps(a){ this[3] = a; }
  get fst(){ return this.arr[0]; }

  reset(){
    this.arr.length = 0;
    this.seps.length = 0;
    return this;
  }
};

class ASTNterm extends ASTElem{
  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;
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
  constructor(graph, ast, index, ref){
    super(graph, ast, index, ref);
    if(graph.dsr) return;
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

module.exports = Object.assign(AST, {
  ASTNode,
  ASTDef,
  ASTPat,
  ASTElem,
  ASTNterm,
  ASTTerm,
});