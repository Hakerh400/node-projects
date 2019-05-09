'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class StackFrame extends SG.Node{
  static ptrsNum = 2;

  constructor(g, prev=null){
    super(g);
    if(g.dsr) return;

    this.prev = prev;
    this.val = null;
    this.i = 0;
    this.j = 0;
  }

  get prev(){ return this[0]; } set prev(a){ this[0] = a; }
  get val(){ return this[1]; } set val(a){ this[1] = a; }

  ser(ser=new O.Serializer()){
    return ser.writeInt(this.i).writeInt(this.j);
  }

  deser(ser){
    this.i = ser.readInt();
    this.j = ser.readInt();
    return this;
  }

  tick(intp, th){ O.virtual('tick'); }
};

module.exports = StackFrame;