'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class StackFrame extends SG.Node{
  static ptrsNum = this.keys(['prev', 'rval']);

  #hval = 0;

  constructor(g){
    super(g);
    if(g.dsr) return;

    this.prev = null;
    this.rval = null;

    this.srcPos = 0;
    this.i = 0;
    this.j = 0;
  }

  ser(s){
    super.ser(s);
    s.write(this.#hval);
    s.writeUint(this.srcPos);
    s.writeInt(this.i);
    s.writeInt(this.j);
  }

  deser(s){
    super.deser(s);
    this.#hval = s.read();
    this.srcPos = s.readUint();
    this.i = s.readInt();
    this.j = s.readInt();
  }

  get intp(){ return this.g.intp; }
  get isFunc(){ return 0; }

  get hval(){ const hv = this.#hval; this.#hval = 0; return hv; }
  set hval(hv){ this.#hval = hv; }
  get nval(){ const hv = this.#hval; this.#hval = 0; return !hv; }
  get gval(){ const v = this.rval; this.rval = null; return v; }

  tick(th){ O.virtual('tick'); }
  catch(err, th){ th.throw(err); }
}

module.exports = StackFrame;