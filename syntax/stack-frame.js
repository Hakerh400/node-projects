'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class StackFrame extends SG.Node{
  static ptrsNum = 2;

  constructor(graph, prev=null){
    super(graph);
    if(graph.dsr) return;

    this.prev = prev;
    this.val = null;
    this.i = 0;
    this.j = 0;
  }

  ser(ser=new O.Serializer()){
    return ser.writeInt(this.i).writeInt(this.j);
  }

  deser(ser){
    this.i = ser.readInt();
    this.j = ser.readInt();
    return this;
  }

  get prev(){ return this[0]; } set prev(a){ this[0] = a; }
  get val(){ return this[1]; } set val(a){ this[1] = a; }

  ret(val){
    const {prev} = this;
    if(prev !== null) prev.val = val;
    else this.val = val;
  }
};

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

class Compile extends StackFrame{
  static ptrsNum = 1;

  constructor(graph, prev, elem){
    super(graph, prev);
    if(graph.dsr) return;

    this.elem = elem;
  }

  get elem(){ return this[0]; } set elem(a){ this[0] = a; }
};

class CompileDef extends Compile{
  constructor(graph, prev, elem){
    super(graph, prev, elem);
    if(graph.dsr) return;
  }
};

class CompileArr extends Compile{
  constructor(graph, prev, elem){
    super(graph, prev, elem);
    if(graph.dsr) return;
  }
};

module.exports = Object.assign(StackFrame, {
  Parse,
  ParseDef,
  ParsePat,
  ParseElem,
  
  Compile,
  CompileDef,
  CompileArr,
});