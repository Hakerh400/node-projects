'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const StackFrame = require('./stack-frame');
const AST = require('./ast');

const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

class Parser extends StackFrame{
  static ptrsNum = 7;

  constructor(graph, syntax=null){
    super(graph);
    if(graph.dsr) return;

    this.ast = new AST(graph, syntax, new SG.String(graph, str));
    this.cache = graph.ca(str.length, () => new SG.Map(graph));
    this.parsing = graph.ca(str.length, () => new SG.Set(graph));
    this.sfDef = new ParseDef(graph, null, 0, def);
    this.sf = this.sfDef;
  }

  get ast(){ return this[2]; } set ast(a){ this[2] = a; }
  get cache(){ return this[3]; } set cache(a){ this[3] = a; }
  get parsing(){ return this[4]; } set parsing(a){ this[4] = a; }
  get sfDef(){ return this[5]; } set sfDef(a){ this[5] = a; }
  get sf(){ return this[6]; } set sf(a){ this[6] = a; }
}

class Parse extends StackFrame{
  static ptrsNum = 4;

  constructor(graph, prev, index=0, ref=null){
    super(graph, prev);
    if(graph.dsr) return;

    this.ref = ref;
    this.node = null;
    this.index = index;
  }

  ser(ser=new O.Serializer()){
    return super.ser(ser).writeUint(this.index);
  }

  deser(ser){
    super.deser(ser);
    this.index = ser.readUint();
    return this;
  }

  get ref(){ return this[2]; } set ref(a){ this[2] = a; }
  get node(){ return this[3]; } set node(a){ this[3] = a; }
};

class ParseDef extends Parse{
  static ptrsNum = 5;

  constructor(graph, prev, index, ref){
    super(graph, prev, index, ref);
    if(graph.dsr) return;

    this.nodePrev = null;
  }

  get nodePrev(){ return this[4]; } set nodePrev(a){ this[4] = a; }
};

class ParsePat extends Parse{
  constructor(graph, prev, index, ref){
    super(graph, prev, index, ref);
    if(graph.dsr) return;
  }
};

class ParseElem extends Parse{
  constructor(graph, prev, index, ref){
    super(graph, prev, index, ref);
    if(graph.dsr) return;
  }
};

module.exports = Object.assign(Parser, {
  Parse,
  ParseDef,
  ParsePat,
  ParseElem,
});