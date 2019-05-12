'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');
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

  get active(){ return this.sf !== null || this.hasErr; }
  get done(){ return !this.active; }

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

  tick(){
    const {intp} = this.g;
    const {sf} = this;

    if(this.hasErr){
      const {err} = this;

      this.err = null;
      this.hasErr = 0;

      if(sf !== null) sf.catch(err, this);
      else intp.catch(err, this);
      return;
    }

    if(!(sf instanceof SF))
      throw new Error(`[TH.TICK] ${SG.getName(sf)} is not a stack frame`);

    sf.tick(this);
    if(this.done) intp.removeThread(this);
  }

  addFunc(func){
    func.funcPrev = this.func;
    this.func = func;
  }

  removeFunc(){
    const {func} = this;
    this.func = func.funcPrev;
    func.funcPrev = null;
  }

  getFuncs(){
    const funcs = [];
    for(let {func} = this; func !== null; func = func.funcPrev)
      funcs.push(func);
    return funcs;
  }

  call(sf, tco=0){
    if(!(sf instanceof SF))
      throw new Error(`[TH.CALL] ${SG.getName(sf)} is not a stack frame`);

    if(tco && this.sf !== null) this.sf = this.sf.prev;
    sf.prev = this.sf;
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