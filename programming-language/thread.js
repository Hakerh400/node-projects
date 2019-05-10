'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class Thread extends SG.Node{
  static ptrsNum = this.keys(['sf']);

  constructor(graph, sf=null, index=-1){
    super(graph);
    if(graph.dsr) return;

    this.sf = sf;
    this.index = index;
  }

  get active(){ return this.sf !== null; }
  get done(){ return this.sf === null; }

  ser(s){ s.writeInt(this.index); }
  deser(s){ this.index = s.readInt(); }

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

    if(sf !== null){
      sf.rval = val;
      sf.hval = 1;
    }
  }
};

module.exports = Thread;