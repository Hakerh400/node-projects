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
      '[]': new UserlandFunction(g),
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

  createLocal(str, val, skipFirst=0){
    let {func} = this.th;
    if(skipFirst) func = func.parent;
    if(func instanceof Function) func.setIdent(str, val);
    else this.idents.set(str, val);
  }

  getLocal(str){
    for(let {func} = this.th; func instanceof Function; func = func.parent)
      if(func.hasIdent(str)) return func.getIdent(str);

    if(this.idents.has(str)) return this.idents.get(str);
    return this.zero;
  }

  setLocal(str, val){
    for(let {func} = this.th; func instanceof Function; func = func.parent)
      if(func.hasIdent(str)) return func.getIdent(str, val);

    return this.idents.set(str, val);
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

    if(this.nval) return th.call(chains[evald.length].clone());
    evald.push(this.gval);
  }

  clone(){ return new this.constructor(this.g, this.chains); }

  get length(){ return this.chains.length; }
  get(index){ return this.evald.get(index); }

  getIdent(index){
    const {chains} = this;
    if(index >= chains.length) return null;
    return chains[index].getIdent();
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

    if(this.nval) return th.call(val.invoke(lists[i].clone()));
    this.val = this.gval;
    this.i++;
  }

  clone(){ return new this.constructor(this.g, this.val, this.lists); }
  get length(){ return this.lists.length; }

  getIdent(){
    if(this.i !== -1) throw new TypeError('Cannot get left-value of an evaluated chain');
    if(this.lists.length !== 0) return null;
    return this.val;
  }
}

class Identifier extends SF{
  static ptrsNum = this.keys(['identName']);
  
  constructor(g, identName){
    super(g, identName);
    if(g.dsr) return;

    this.identName = identName;
  }

  tick(th){
    th.ret(this.intp.getLocal(this.str));
  }

  get str(){ return this.identName.str; }
}

class Function extends cgs.Function{
  static ptrsNum = this.keys(['idents', 'args', 'parent']);
  
  constructor(g, args=null){
    super(g, g.th.func.script, null, args);
    if(g.dsr) return;

    this.idents = null;
    this.args = args;
    this.parent = g.th.func instanceof Function ? g.th.func : null;
  }

  invoke(args){
    return new this.constructor(this.g, args, this);
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

    this.ident = args !== null ? args.getIdent(0) : null;
  }

  tick(th){
    const {intp, ident} = this;

    if(this.nval) return th.call(this.args);
    const args = this.gval;

    if(ident === null)
      return th.ret(intp.zero);

    const val = args.get(1);
    intp.setLocal(ident.str, val);
    th.ret(val);
  }
}

class Variable extends Function{
  static ptrsNum = this.keys(['ident']);

  constructor(g, args=null){
    super(g, args);
    if(g.dsr) return;

    this.ident = args !== null ? args.getIdent(0) : null;
  }

  tick(th){
    const {intp, ident} = this;

    if(this.nval) return th.call(this.args);
    const args = this.gval;

    if(ident === null)
      return th.ret(intp.zero);

    const val = args.get(1);
    intp.createLocal(ident.str, val, 1);
    th.ret(val);
  }
}

class UserlandFunction extends Function{
  static ptrsNum = this.keys(['formalArgs', 'body']);

  constructor(g, args=null, parent=null){
    super(g, args);
    if(g.dsr) return;

    if(parent === null){
      this.formalArgs = null;
      this.body = null;
      return;
    }

    if(parent !== null){
      const {i} = parent;
      this.i = i + 1;

      if(i === 0){
        this.formalArgs = args;
        return;
      }

      this.formalArgs = parent.formalArgs;

      if(i === 1){
        this.body = args;
        return;
      }

      this.body = parent.body;
    }
  }

  tick(th){
    const {formalArgs: fa, body, args} = this;

    switch(this.i){
      case 1:
        for(let i = 0; i !== args.length; i++){
          if(args.getIdent(i)) continue;
          if(this.nval) return th.call(this.args);
          return th.ret(this.intp.zero);
        }

        th.ret(this);
        break;

      case 2:
        th.ret(this);
        break;

      case 3: {
        const {j} = this;
        const len = fa.length;

        if(j === len){
          this.j = 0;
          this.i++;
          return;
        }

        if(j < args.length){
          if(this.nval) return th.call(args.chains[j]);
          this.setIdent(fa.chains[j].val.str, this.gval);
        }else{
          this.setIdent(fa.chains[j].val.str, this.intp.zero);
        }

        this.j++;
        break;
      }

      case 4: {
        const {j} = this;
        const len = body.length;

        if(len === 0) return th.ret(this.intp.zero);

        if(this.nval) return th.call(body.chains[j].clone());
        const result = this.gval;

        if(++this.j === len)
          th.ret(result);
        break;
      }
    }
  }
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

    log('EOF', this.g.stdout.hasMore ? 0 : 1);
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
  UserlandFunction,
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