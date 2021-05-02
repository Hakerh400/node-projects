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

const builtinsNum = 1;

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

    const createTable = function*(expr){
      const table = O.ca(builtinsNum, () => null);
      const targetArgMap = O.obj();

      const insertExpr = function*(expr){
        if(expr instanceof Combinator){
          const {name} = expr;

          if(pfree.hasFunc(name))
            return O.tco(insertExpr, pfree.getFunc(name))

          assert(name === combs.IOTA.name);
          return 0;
        }

        assert(expr instanceof Application);

        const target = yield [insertExpr, expr.target];
        const arg = yield [insertExpr, expr.arg];

        if(!O.has(targetArgMap, target))
          targetArgMap[target] = O.obj();

        if(!O.has(targetArgMap[target], arg)){
          targetArgMap[target][arg] = table.length;
          table.push([target, arg]);
        }

        return targetArgMap[target][arg];
      };

      yield [insertExpr, expr];

      return table;
    };

    const serTable = function*(table){
      const ser = new O.NatSerializer();
      const targetArgMap = O.obj();
      const tableIndices = [0];

      let remainingExprs = 1;

      const write = (mod, val) => {
        // debugger;
        log(mod, val);
        ser.write(mod, val);
      };

      const serIndex = function*(targetIndex, index){
        const hasMore = remainingExprs !== 1;
        const isOld = index < tableIndices.length;

        if(hasMore){
          if(isOld){
            write(2, 0);
            writeOldIndex(targetIndex, index);
            return;
          }

          write(2, 1);
          yield [writeNewIndex, index];

          return;
        }

        if(isOld){
          writeOldIndex(targetIndex, index);
          return;
        }

        write(1, getAvailArgs().length);
        yield [writeNewIndex, index];
      };

      const writeNewIndex = function*(index){
        const [target, arg] = table[index];

        remainingExprs++;
        yield [serIndex, null, target];

        remainingExprs--;
        yield [serIndex, target, arg];

        tableIndices.push(tableIndices.length);

        if(!O.has(targetArgMap, target))
          targetArgMap[target] = O.obj();

        targetArgMap[target][arg] = index;
      };

      const writeOldIndex = (targetIndex, index) => {
        const availArgs = getAvailArgs(targetIndex);
        const newIndex = availArgs.indexOf(index);

        assert(newIndex !== -1);
        write(availArgs.length, newIndex);
      };

      const getAvailArgs = targetIndex => {
        if(targetIndex === null || !O.has(targetArgMap, targetIndex))
          return tableIndices;

        const oldArgs = targetArgMap[targetIndex];

        const availArgs = tableIndices.filter(i => {
          return !O.has(oldArgs, i);
        });

        return availArgs;
      };

      yield [serIndex, null, table.length - 1];

      return ser.output;
    };

    const table = yield [createTable, mainExpr];
    const serd = yield [serTable, table];

    O.logb();
    log(table.map((a, i) => {
      const str = a !== null ? a.join(' ') : 'i';
      return `${i} - ${str}`;
    }).join('\n'));
    O.logb();

    O.exit();

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