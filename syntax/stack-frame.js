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

class Compile extends StackFrame{
  static ptrsNum = 3;

  constructor(graph, prev, elem){
    super(graph, prev);
    if(graph.dsr) return;

    this.elem = elem;
  }

  get elem(){ return this[2]; } set elem(a){ this[2] = a; }
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
  Compile,
  CompileDef,
  CompileArr,
});