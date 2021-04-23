'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');
const cs = require('./ctors');
const core = require('./core');
const opts = require('./opts');

const {MAIN_FUNC_NAME} = opts;

const emptyArr = [];

const name2str = name => {
  if(typeof name === 'symbol')
    return name.description;

  if(name === MAIN_FUNC_NAME)
    return name;

  return `[${name}]`;
};

const makeAvailArgsFunc = (calls, allArgs) => {
  const getAvailArgs = index => {
    if(index === null) return allArgs;
    if(!O.has(calls, index)) return allArgs;

    const args = calls[index];

    const availArgs = allArgs.filter(a => {
      return !O.has(args, a);
    });

    assert(availArgs.length !== 0);

    return availArgs;
  };

  return getAvailArgs;
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

    yield [[pfree, 'elimRec']];
    yield [[pfree, 'addBuiltins']];

    return pfree;
  }

  static *unpack(n){
    const ser = new O.NatSerializer(n);

    const exprIndexMap = new Map();
    const calls = O.obj();
    const table = [];
    const allArgs = [0];

    const iotaExpr = new cs.Expression(core.IOTA, emptyArr);
    exprIndexMap.set(iotaExpr, 0);
    table.push(iotaExpr);

    const getAvailArgs = makeAvailArgsFunc(calls, allArgs);

    const addCall = (target, arg, index) => {
      if(!O.has(calls, target))
        calls[target] = O.obj();

      calls[target][arg] = index;
    };

    const hasIndex = expr => {
      return exprIndexMap.has(expr);
    };

    const getIndex = expr => {
      assert(hasIndex(expr));
      return exprIndexMap.get(expr);
    };

    const addIndex = (expr, index) => {
      assert(!hasIndex(expr));
      exprIndexMap.set(expr, index);
    };

    const unpackExpr = function*(targetPrev=null){
      if(!ser.read(2)){
        const availArgs = getAvailArgs(targetPrev);
        return table[availArgs[ser.read(availArgs.length)]];
      }

      const target = yield [unpackExpr];
      const targetIndex = getIndex(target);

      const arg = yield [unpackExpr, targetIndex];
      const argIndex = getIndex(arg);

      const expr = new cs.Expression(
        new cs.Expression(targetIndex, emptyArr),
        [new cs.Expression(argIndex, emptyArr)]);

      const index = table.length;

      addCall(targetIndex, argIndex, expr);
      addIndex(expr, index);

      assert(allArgs.length === index);
      allArgs.push(index);
      table.push(expr);

      return expr;
    };

    const mainExpr = yield [unpackExpr];

    const funcsNum = table.length;
    const prog = new cs.Program();

    for(let i = 0; i !== funcsNum; i++){
      const expr = table[i];
      const name = i === funcsNum - 1 ? MAIN_FUNC_NAME : i;

      const funcDef = new cs.FunctionDefinition(name, emptyArr, expr);
      prog.addFunc(funcDef);
    }

    return prog;
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

  *addBuiltins(){
    const sii = new Application(new Application(combs.S, combs.I), combs.I);

    this.addFunc(combs.I.name, new Application(combs.IOTA, combs.IOTA));
    this.addFunc(combs.K.name, new Application(combs.IOTA, new Application(combs.IOTA, combs.I)));
    this.addFunc(combs.S.name, new Application(combs.IOTA, combs.K));
    this.addFunc(combs.DOT.name, new Application(new Application(combs.S, new Application(combs.K, combs.S)), combs.K));
    this.addFunc(combs.FLIP.name, new Application(new Application(combs.S, new Application(new Application(combs.DOT, combs.DOT), combs.S)), new Application(combs.K, combs.K)));
    this.addFunc(combs.FIX.name, new Application(sii, new Application(new Application(combs.DOT, new Application(combs.S, combs.I)), sii)));
  }

  *pack(){
    const pfree = this;
    const mainExpr = this.getFunc(MAIN_FUNC_NAME);

    const stack = [];
    const calls = O.obj();
    const cache = new Map();
    const allArgs = [0];

    let exprsNum = 1;

    const getAvailArgs = makeAvailArgsFunc(calls, allArgs);

    const modVal = (mod, val) => {
      assert(val >= 0);
      assert(val < mod);
      assert(mod > 0);

      return [mod, val];
    };

    const push = (mod, val) => {
      stack.push(modVal(mod, val));
    };

    const insert = (index, mod, val) => {
      stack.splice(index, 0, modVal(mod, val));
    };

    const hasCall = (target, arg) => {
      if(!O.has(calls, target)) return 0;
      return O.has(calls[target], arg);
    };

    const getCall = (target, arg) => {
      return calls[target][arg];
    };

    const addCall = (target, arg, index) => {
      if(!O.has(calls, target))
        calls[target] = O.obj();
      
      calls[target][arg] = index;
    };

    const table = [combs.IOTA];
    combs.IOTA.index = 0

    const packExpr = function*(expr, targetPrev=null){
      const availArgs = getAvailArgs(targetPrev);
      const stackIndex = stack.length;

      assert(availArgs.length !== 0);

      const writeOld = function*(index){
        assert(availArgs.length !== 0);

        const availIndex = availArgs.indexOf(index);

        if(availIndex === -1){
          log(`expr: ${yield [expr2str, expr]}`);
          log(`tprev: ${targetPrev !== null ? yield [expr2str, table[targetPrev]] : 'null'}`);
          log();
          log((yield [O.mapr, availArgs, function*(index){
            return O.tco(expr2str, table[index]);
          }]).join('\n'));
          log();
          log(yield [expr2str, table[index]]);
          O.logb();
          assert.fail();
        }

        push(2, 0);
        push(availArgs.length, availIndex);
      };

      const writeNew = function*(index){
        assert(index === allArgs.length);
        assert(stackIndex < stack.length);

        allArgs.push(index);
        insert(stackIndex, 2, 1);
      };

      if(expr instanceof Combinator){
        const {name} = expr;

        if(name === combs.IOTA.name){
          yield [writeOld, 0];
          return 0;
        }

        return O.tco(packExpr, pfree.getFunc(name), targetPrev);
      }

      if(cache.has(expr)){
        const index = cache.get(expr);
        yield [writeOld, index];
        return index;
      }

      const target = yield [packExpr, expr.target];
      const arg = yield [packExpr, expr.arg, target];

      if(hasCall(target, arg)){
        const index = getCall(target, arg);

        yield [writeOld, index];
        cache.set(expr, index);

        return index;
      }

      const index = exprsNum++;

      expr.index = index;
      table.push(expr);

      yield [writeNew, index];
      addCall(target, arg, index);
      cache.set(expr, index);

      return index;
    };

    const expandExpr = function*(expr){
      let exprNew = null;

      if(expr instanceof Combinator){
        const {name} = expr;

        if(name === combs.IOTA.name)
          return 'i';

        exprNew = yield [expandExpr, pfree.getFunc(name)];
      }else{
        const target = yield [expandExpr, expr.target];
        const arg = yield [expandExpr, expr.arg];

        exprNew = new Application(target, arg);
      }

      return exprNew;
    };

    const expr2str = function*(expr, parens=0){
      if(expr instanceof Combinator){
        const {name} = expr;

        if(name === combs.IOTA.name)
          return 'i';

        return O.tco(expr2str, pfree.getFunc(name), parens);
      }

      const target = yield [expr2str, expr.target];
      const arg = yield [expr2str, expr.arg, 1];
      const str = `${target}${arg}`;

      if(parens) return `(${str})`;
      return str;
    };

    const getIndex = function*(expr){
      if(expr instanceof Combinator){
        const {name} = expr;

        if(name === combs.IOTA.name)
          return 0;

        return O.tco(getIndex, pfree.getFunc(name));
      }

      const target = yield [getIndex, expr.target];
      const arg = yield [getIndex, expr.arg];

      return getCall(target, arg);
    };

    const stack2str = () => {
      return stack.map(([mod, val]) => {
        assert(val < mod);

        if(mod === 1) return '';
        if(mod === 2) return val;
        return ` [${mod}.${val}] `;
      }).join('').trim().replace(/\s+/g, ' ');
    };

    yield [packExpr, mainExpr];

    // log(table[2].arg);
    log(stack2str());
    O.logb();
    log((yield [O.mapr, table, function*(expr, index){
      const name = index === table.length - 1 ? 'main' : String(index);

      let exprStr = null;

      if(expr instanceof Combinator){
        exprStr = name2str(expr.name);
      }else{
        const targetIndex = yield [getIndex, expr.target];
        const argIndex = yield [getIndex, expr.arg];

        exprStr = `${targetIndex} ${argIndex}`;
      }

      return `${`${name} - ${exprStr}`.padEnd(20)}${expr}`;
    }]).join('\n'));
    // O.logb();
    // log(yield [expr2str, mainExpr]);
    // log(stack2str());
    // O.exit();

    const ser = new O.NatSerializer();

    for(const [mod, num] of stack)
      ser.write(mod, num);

    return ser.output;
  }

  *toStr(){
    let str = '';
    let first = 1;

    for(const name of this.funcNames){
      if(!first) str += '\n';
      first = 0;

      str += `${name2str(name)} - ${yield [[this.getFunc(name), 'toStr']]}`;
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
  IOTA: new Combinator(Symbol('i')),
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