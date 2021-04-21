'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

class Base{
  *toStr(){ O.virtual('toStr'); }

  toString(){
    return O.rec([this, 'toStr']);
  }
}

class PointFree extends Base{
  static *fromProg(prog){
    const pfree = new PointFree();

    for(const func of prog.funcsArr){
      const {name, args} = func;
      let expr = yield [[Expression, 'from'], func.expr];

      for(let i = args.length - 1; i !== -1; i--){
        const arg = args[i];
        expr = yield [[expr, 'elimArg'], arg];
      }

      pfree.addFunc(name, expr);
    }

    return pfree;
  }

  funcs = O.obj();
  funcNames = [];

  hasFunc(name){
    return O.has(this.funcs, name);
  }

  getFunc(name){
    assert(this.hasFunc(name));
    return this.funcs[name];
  }

  addFunc(name, expr){
    assert(!this.hasFunc(name));
    this.funcs[name] = expr;
    this.funcNames.push(name);
  }

  *toStr(){
    let str = '';

    for(const name of this.funcNames){
      if(str !== '') str += '\n';
      str += `${name} = ${yield [[this.getFunc(name), 'toStr']]}`;
    }

    return str;
  }
}

class Expression extends Base{
  static *from(csExpr){
    if(typeof csExpr === 'string')
      return new Combinator(csExpr);

    let expr = yield [[this, 'from'], csExpr.target];

    for(const arg of csExpr.args)
      expr = new Application(expr, yield [[this, 'from'], arg]);

    return expr;
  }

  constructor(combs){
    super();
    this.combs = combs;
  }

  hasComb(name){
    return O.has(this.combs, name);
  }

  *eq(other){ O.virtual('elimArg'); }
  *elimArg(){ O.virtual('elimArg'); }
}

class Combinator extends Expression{
  constructor(name){
    super(Object.assign(O.obj(), {[name]: 1}));
    this.name = name;
  }

  *eq(other){
    if(!(other instanceof Combinator)) return 0;
    return other.name === this.name;
  }

  *elimArg(farg){
    if(this.name === farg)
      return I;

    return new Application(K, this);
  }

  *toStr(){
    return this.name;
  }
}

class Application extends Expression{
  constructor(target, arg){
    super(Object.assign(O.obj(), target.combs, arg.combs));
    this.target = target;
    this.arg = arg;
  }

  *eq(other){
    if(!(other instanceof Application)) return 0;

    return (
      (yield [[this.target, 'eq'], other.target]) &&
      (yield [[this.arg, 'eq'], other.arg])
    );
  }

  *elimArg(farg){
    if(!this.hasComb(farg))
      return new Application(K, this);

    const {target, arg} = this;

    if(arg.hasComb(farg)){
      if(target.hasComb(farg))
        return new Application(
          new Application(S, yield [[target, 'elimArg'], farg]),
          yield [[arg, 'elimArg'], farg]);

      if(arg instanceof Combinator)
        return target;

      return new Application(
        new Application(DOT, target),
        yield [[arg, 'elimArg'], farg]);
    }

    return new Application(
      new Application(FLIP, yield [[target, 'elimArg'], farg]),
      arg);
  }

  *toStr(parens=0){
    const s1 = yield [[this.target, 'toStr']];
    const s2 = yield [[this.arg, 'toStr'], 1];
    const s = `${s1} ${s2}`

    return parens ? `(${s})` : s;
  }
}

const K = new Combinator('K');
const S = new Combinator('S');
const I = new Combinator('I');
const DOT = new Combinator('.');
const FLIP = new Combinator('~');

module.exports = Object.assign(PointFree, {
  Expression,
  Combinator,
  Application,

  combs: {
    K,
    S,
    I,
    DOT,
    FLIP,
  },
});