'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');
const cs = require('./ctors');
const opts = require('./opts');

const {MAIN_FUNC_NAME} = opts;

const name2str = name => {
  if(typeof name === 'symbol')
    return name.description;

  if(name === MAIN_FUNC_NAME)
    return name;

  return `[${name}]`;
};

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

    yield O.tco([pfree, 'elimRec']);
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

  delFunc(name){
    assert(this.hasFunc(name));

    const expr = this.funcs[name];

    delete this.funcs[name];
    this.funcNames.splice(this.funcNames.indexOf(name), 1);

    return expr;
  }

  *isRecursive(name, seen=O.obj()){
    if(O.has(seen, name)) return 1;
    seen[name] = 1;

    const expr = this.getFunc(name);

    for(const comb of O.keys(expr.combs)){
      if(!this.hasFunc(comb)) continue;

      if(yield [[this, 'isRecursive'], comb, seen])
        return 1;
    }

    delete seen[name];
    return 0;
  }

  *isDirectlyRecursive(name){
    return this.getFunc(name).hasComb(name);
  }

  *isIndirectlyRecursive(name){
    return (
      (yield [[this, 'isRecursive'], name]) &&
      !(yield [[this, 'isDirectlyRecursive'], name])
    );
  }

  *elimRec(){
    const {funcs, funcNames} = this;

    mainLoop: while(1){
      resolveIndirectRecursion: for(let i = 0; i !== funcNames.length; i++){
        const funcName = funcNames[i];
        if(funcName === MAIN_FUNC_NAME) continue;

        if(!(yield [[this, 'isIndirectlyRecursive'], funcName]))
          continue resolveIndirectRecursion;

        const expr = this.delFunc(funcName);

        for(const ref of funcNames){
          const expr1 = funcs[ref];
          if(!expr1.hasComb(funcName)) continue;

          funcs[ref] = yield [[expr1, 'subst'], funcName, expr];
        }

        continue mainLoop;
      }

      resolveDirectRecursion: for(let i = 0; i !== funcNames.length; i++){
        const funcName = funcNames[i];

        if(!(yield [[this, 'isDirectlyRecursive'], funcName]))
          continue resolveDirectRecursion;

        const expr = funcs[funcName];

        funcs[funcName] = new Application(
          combs.FIX,
          yield [[expr, 'elimArg'], funcName]);

        continue mainLoop;
      }

      break;
    }

    return this;
  }

  *toStr(){
    let str = O.ftext(`
      I a = a
      K a b = a
      S a b c = a c (b c)
      . = S (K S) K
      ~ = S (. . S) (K K)
      fix = (S I I) (. (S I) (S I I))
    `);

    let first = 1;

    for(const name of this.funcNames){
      str += '\n'
      if(first) str += '\n';
      first = 0;

      str += `${name2str(name)} = ${yield [[this.getFunc(name), 'toStr']]}`;
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

  *eq(other){ O.virtual('eq'); }
  *elimArg(){ O.virtual('elimArg'); }
  *subst(){ O.virtual('subst'); }
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
      return combs.I;

    return new Application(combs.K, this);
  }

  *subst(name, expr){
    if(this.name !== name) return this;
    return expr;
  }

  *toStr(){
    return name2str(this.name);
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
    if(other === this) return 1;

    return (
      (yield [[this.target, 'eq'], other.target]) &&
      (yield [[this.arg, 'eq'], other.arg])
    );
  }

  *elimArg(farg){
    if(!this.hasComb(farg))
      return new Application(combs.K, this);

    const {target, arg} = this;

    if(arg.hasComb(farg)){
      if(target.hasComb(farg))
        return new Application(
          new Application(combs.S, yield [[target, 'elimArg'], farg]),
          yield [[arg, 'elimArg'], farg]);

      if(arg instanceof Combinator)
        return target;

      return new Application(
        new Application(combs.DOT, target),
        yield [[arg, 'elimArg'], farg]);
    }

    return new Application(
      new Application(combs.FLIP, yield [[target, 'elimArg'], farg]),
      arg);
  }

  *subst(name, expr){
    if(!this.hasComb(name)) return this;

    const target = yield [[this.target, 'subst'], name, expr];
    const arg = yield [[this.arg, 'subst'], name, expr];

    return new Application(target, arg);
  }

  *toStr(parens=0){
    const s1 = yield [[this.target, 'toStr']];
    const s2 = yield [[this.arg, 'toStr'], 1];
    const s = `${s1} ${s2}`

    return parens ? `(${s})` : s;
  }
}

const combs = {
  I: new Combinator(Symbol('I')),
  K: new Combinator(Symbol('K')),
  S: new Combinator(Symbol('S')),
  DOT: new Combinator(Symbol('.')),
  FLIP: new Combinator(Symbol('~')),
  FIX: new Combinator(Symbol('fix')),
};

module.exports = Object.assign(PointFree, {
  Expression,
  Combinator,
  Application,

  combs,
});