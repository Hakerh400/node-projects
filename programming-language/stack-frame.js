'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');

class StackFrame extends SG.Node{
  static ptrsNum = this.keys(['prev', 'rval']);

  #hval = 0;

  constructor(g, prev=null){
    super(g);
    if(g.dsr) return;

    this.prev = prev;
    this.rval = null;

    this.i = 0;
    this.j = 0;
  }

  ser(s){ super.ser(s); s.write(this.#hval).writeInt(this.i).writeInt(this.j); }
  deser(s){
    super.deser(s);
    this.#hval = s.read();
    this.i = s.readInt();
    this.j = s.readInt();
  }

  get hval(){ const hv = this.#hval; this.#hval = 0; return hv; }
  set hval(hv){ this.#hval = hv; }
  get nval(){ const hv = this.#hval; this.#hval = 0; return !hv; }

  tick(intp, th){ th.ret(this); }
  catch(intp, th, err){ th.throw(err); }
};

module.exports = StackFrame;