'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const InterpreterBase = require('../../interpreter-base');

class Interpreter extends InterpreterBase{
  constructor(g, script){
    super(g, script);
    if(g.dsr) return;
  }
}

class List extends SF{
  static ptrsNum = this.keys(['chains', 'arr']);
  
  constructor(g, chains){
    super(g);
    if(g.dsr) return;

    this.chains = chains;
    this.arr = new cgs.Array(g);
  }

  tick(th){
    const {chains, i} = this;
    if(i === chains.length) return th.ret(this.arr);
    if(this.nval) return th.call(chains[i]);
    this.arr.push(this.rval);
    this.i++;
  }
}

class Chain extends SF{
  static ptrsNum = this.keys(['elems', 'val', 'args']);
  
  constructor(g, elems){
    super(g);
    if(g.dsr) return;

    this.elems = elems;
    this.val = null;
    this.args = null;
  }

  tick(th){
    const {elems, i, j} = this;

    if(i === 0){
      if(this.nval) return th.call(elems[i]);
      this.val = this.rval;
      return this.i++;
    }

    if(i === elems.length) return th.ret(this.val);

    if(j === 0){
      if(this.nval) return th.call(elems[i]);
      this.args = this.rval;
      this.j = 1;
    }else{
      if(this.nval) return th.call(new Call(this.g, this.val, this.args));
      this.val = this.rval;
      this.i++; this.j = 0;
    }
  }
}

class Identifier extends SF{
  static ptrsNum = this.keys(['num']);
  
  constructor(g, num){
    super(g);
    if(g.dsr) return;

    this.num = num;
  }

  ser(s){ super.ser(); s.writeUint(this.num); }
  deser(s){ super.deser(); this.num = s.readUint(); }
}

class Call extends SF{
  static ptrsNum = this.keys(['func', 'args']);
  
  constructor(g, func, args){
    super(g);
    if(g.dsr) return;

    this.func = func;
    this.args = args;
  }

  tick(th){
    log(this.func.num);
    log([...this.args].map(a => a.num));
    O.proc.exit();
  }
}

const ctorsArr = [
  List,
  Chain,
  Identifier,
];

const ctorsObj = O.obj();
for(const ctor of ctorsArr)
  ctorsObj[ctor.name] = ctor;

module.exports = Object.assign(Interpreter, {
  ctorsArr,
  ctorsObj,
});

const Parser = require('./parser');
const Compiler = require('./compiler');

Interpreter.Parser = Parser;
Interpreter.Compiler = Compiler;