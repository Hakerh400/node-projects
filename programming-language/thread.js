'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class Thread extends SG.Node{
  static ptrsNum = this.keys(['sf', 'err']);

  constructor(graph, sf=null, index=-1){
    super(graph);
    if(graph.dsr) return;

    this.sf = sf;
    this.err = null;

    this.index = index;
    this.hasErr = 0;
  }

  get active(){ return this.sf !== null; }
  get done(){ return this.sf === null; }

  ser(s){ super.ser(s); s.writeInt(this.index).write(this.hasErr); }
  deser(s){
    super.deser(s);
    this.index = s.readInt();
    this.hasErr = s.read();
  }

  tick(intp){
    const {sf} = this;

    if(this.hasErr){
      const {err} = this;

      this.err = null;
      this.hasErr = 0;

      if(sf !== null) sf.catch(intp, this, err);
      else intp.catch(this, err);
      return;
    }

    sf.tick(intp, this);
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

  throw(err){
    this.ret();
    this.err = err;
    this.hasErr = 1;
  }
};

module.exports = Thread;