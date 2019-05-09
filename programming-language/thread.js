'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class Thread extends SG.Node{
  static ptrsNum = 1;

  constructor(graph, sf=null, index=-1){
    super(graph);
    if(graph.dsr) return;

    this.sf = sf;
    this.index = index;
  }

  get sf(){ return this[0]; } set sf(a){ this[0] = a; }

  get active(){ return this.sf !== null; }
  get done(){ return this.sf === null; }

  ser(ser=new O.Serializer()){
    return ser.writeInt(this.index);
  }

  deser(ser){
    this.index = ser.readInt();
    return this;
  }

  tick(intp){
    this.sf.tick(intp, this);
    if(this.done) intp.removeThread(this);
  }

  call(sf, tco=0){
    sf.prev = tco ? null : this.sf;
    this.sf = sf;
  }

  ret(val=null){
    const sf = this.sf = this.sf.prev;
    if(sf !== null) sf.val = val;
  }
};

module.exports = Thread;