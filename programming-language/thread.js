'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const cgs = require('./common-graph-nodes');

class Thread extends SG.Node{
  static ptrsNum = this.keys(['sf', 'func', 'err']);

  constructor(graph, sf=null, index=-1){
    super(graph);
    if(graph.dsr) return;

    this.sf = sf;
    this.func = null;
    this.err = null;

    this.index = index;
    this.hasErr = 0;

    if(sf.isFunc) this.addFunc(sf);
  }

  get active(){ return this.sf !== null; }
  get done(){ return this.sf === null; }

  ser(s){
    super.ser(s);
    s.writeInt(this.index);
    s.write(this.hasErr);
  }

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

      if(sf !== null) sf.catch(err, this, intp);
      else intp.catch(err, this);
      return;
    }

    sf.tick(this, intp);
    if(this.done) intp.removeThread(this);
  }

  addFunc(func){
    func.prevFunc = this.func;
    this.func = func;
  }

  removeFunc(){
    const {func} = this;
    this.func = func.prevFunc;
    func.prevFunc = null;
  }

  call(sf, tco=0){
    sf.prev = tco ? null : this.sf;
    this.sf = sf;
    if(sf.isFunc) this.addFunc(sf);
  }

  ret(val=null){
    let {sf} = this;

    if(sf.isFunc) this.removeFunc();
    sf = this.sf = sf.prev;

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
}

module.exports = Thread;