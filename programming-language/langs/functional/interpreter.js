'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const InterpreterBase = require('../../interpreter-base');

class Interpreter extends InterpreterBase{
  static ptrsNum = this.keys(['idents']);

  constructor(g, script){
    super(g, script);
    if(g.dsr) return;

    this.idents = cgs.Object.from(g, {
      '0': new Zero(g),
      '1': new One(g),
      '==': new Equality(g),
      '=': new Assignment(g),
      'var': new Variable(g),
      '[]': new NewFunction(g),
      'read': new Read(g),
      'write': new Write(g),
      'eof': new Eof(g),
    });
  }

  setGlobal(str, val){
    this.idents.set(str, val);
  }

  getGlobal(str){
    const {idents} = this;
    if(idents.has(str)) return idents.get(str);
    return this.zero;
  }

  getGlobalIndex(index){
    const {idents} = this;
    if(index >= idents.length) index = 0;
    return idents.arr[index][1];
  }

  createLocal(str, val){
    const {func} = this.th;
    if(func !== null) func.setIdent(str, val);
    else this.idents.set(str, val);
  }

  getLocal(str){
    for(const func of this.th.funcs)
      if(func.hasIdent(str)) return func.getIdent();

    if(this.idents.has(str)) return this.idents.get(str);
    return this.zero;
  }

  setLocal(str){
    O.noimpl('setLocal');
  }

  get zero(){
    return this.getGlobalIndex(0);
  }
}

class List extends SF{
  static ptrsNum = this.keys(['chains', 'evald']);
  
  constructor(g, chains){
    super(g);
    if(g.dsr) return;

    this.chains = chains;
    this.evald = new EvaluatedList(g);
  }

  tick(th){
    const {chains, evald} = this;

    if(evald.length === chains.length)
      return th.ret(this);

    if(this.nval) return th.call(chains[evald.length]);
    evald.push(this.gval);
  }

  get length(){ return this.chains.length; }
  get(index){ return this.evald.get(index); }

  getLval(index){
    const {chains} = this;
    if(index >= chains.length) return null;
    return chains[index].getLval();
  }

  getLvals(){
    const lvals = new cgs.Array(this.g);

    for(const chain of this.chains){
      const lval = chain.getLval();
      if(lval === null) return null;
      lvals.push(lval);
    }

    return lvals;
  }
}

class EvaluatedList extends cgs.Array{
  constructor(g){
    super(g);
    if(g.dsr) return;
  }

  get(index){
    if(index >= this.length) return this.g.intp.zero;
    return this[index];
  }
}

class Chain extends SF{
  static ptrsNum = this.keys(['val', 'lists']);
  
  constructor(g, val, lists){
    super(g);
    if(g.dsr) return;

    this.val = val;
    this.lists = lists;

    this.i = -1;
  }

  tick(th){
    const {g, val, lists, i} = this;

    if(i === lists.length)
      return th.ret(this.val);

    if(i === -1){
      if(this.nval) return th.call(val);
      this.val = this.gval;
      return this.i = 0;
    }

    if(this.nval) return th.call(val.invoke(lists[i]));
    this.val = this.gval;
    this.i++;
  }

  get length(){ return this.lists.length; }

  getLval(){
    if(this.i !== -1) throw new TypeError('Cannot get left-value of an evaluated chain');
    if(this.lists.length !== 0) return null;
    return this.val;
  }
}

class Identifier extends SF{
  static ptrsNum = this.keys(['str']);
  
  constructor(g, str){
    super(g);
    if(g.dsr) return;

    this.str = str;
  }

  tick(th){
    th.ret(this.intp.getLocal(this.str.str));
  }
}

class Function extends cgs.Function{
  static ptrsNum = this.keys(['idents', 'args']);
  
  constructor(g, args=null){
    super(g);
    if(g.dsr) return;

    this.idents = null;
    this.args = args;
  }

  invoke(args){
    return new this.constructor(this.g, args);
  }

  hasIdent(str){
    const {idents} = this;
    if(idents === null) return 0;
    return idents.has(str);
  }

  setIdent(str, val){
    if(this.idents === null)
      this.idents = new cgs.Object(this.g);
    this.idents.set(str, val);
  }

  getIdent(str){
    return this.idents.get(str);
  }

  get bool(){
    return this !== this.intp.zero;
  }
}

class Zero extends Function{
  tick(th){
    if(this.nval) return th.call(this.args);
    const args = this.gval;

    th.ret(args.get(1));
  }
}

class One extends Function{
  tick(th){
    if(this.nval) return th.call(this.args);
    const args = this.gval;

    th.ret(args.get(0));
  }
}

class Equality extends Function{
  tick(th){
    if(this.nval) return th.call(this.args);
    const args = this.gval;

    th.ret(this.intp.getGlobalIndex(args.get(0) === args.get(1) ? 1 : 0));
  }
}

class Assignment extends Function{
  static ptrsNum = this.keys(['ident']);

  constructor(g, args=null){
    super(g, args);
    if(g.dsr) return;

    this.ident = args !== null ? args.getLval(0) : null;
  }

  tick(th){
    const {intp, ident} = this;

    if(this.nval) return th.call(this.args);
    const args = this.gval;

    if(ident === null)
      return th.ret(intp.zero);

    const val = args.get(1);
    intp.setLocalIdent(ident.str, val);
    th.ret(val);
  }
}

class Variable extends Function{
  static ptrsNum = this.keys(['ident']);

  constructor(g, args=null){
    super(g, args);
    if(g.dsr) return;

    this.ident = args !== null ? args.getLval(0) : null;
  }

  tick(th){
    const {intp, ident} = this;

    if(this.nval) return th.call(this.args);
    const args = this.gval;

    if(ident === null)
      return th.ret(intp.zero);

    const val = args.get(1);
    intp.createLocal(ident.str, val);
    th.ret(val);
  }
}

class NewFunction extends Function{
  tick(th){
    const {args} = this;

    const lvals = args.getLvals();
    if(lvals === null){
      if(this.nval) return th.call(this.args);
      return this.intp.zero;
    }

    th.ret(new FunctionTemplate(this.g, lvals));
  }
}

class FunctionTemplate extends Function{
  static ptrsNum = this.keys(['idents']);
}

class Read extends Function{
  tick(th){
    if(this.nval) return th.call(this.args);
    const args = this.gval;

    const buf = this.g.stdin.read(1);
    th.ret(this.intp.getGlobalIndex(buf[0] & 1));
  }
}

class Write extends Function{
  tick(th){
    if(this.nval) return th.call(this.args);
    const args = this.gval;

    const val = args.get(0);
    const buf = Buffer.from([val.bool]);
    this.g.stdout.write(buf, 1);

    th.ret(val);
  }
}

class Eof extends Function{
  tick(th){
    if(this.nval) return th.call(this.args);
    const args = this.gval;

    th.ret(this.intp.getGlobalIndex(this.g.stdout.hasMore ? 0 : 1));
  }
}

const ctorsArr = [
  List,
  EvaluatedList,
  Chain,
  Identifier,
  Function,
  Zero,
  One,
  Equality,
  Assignment,
  Variable,
  NewFunction,
  Read,
  Write,
  Eof,
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