'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

const rand = mod => {
  assert(mod !== 0);

  const mult = 1 << String(mod).length - 1;

  loop: while(1){
    let n = 0;

    for(let k = mult; k !== 0; k >>= 1){
      if(O.rand(2)) n += k;
      if(n >= mod) continue loop;
    }

    return n;
  }
};

const gen = (ser=null) => {
  const r = (mod=2) => {
    assert(mod !== 0);

    if(ser !== null)
      return Number(ser.read(mod));

    return rand(mod);
  };

  const ri = (start=0) => {
    let n = start;
    while(r()) n++;
    return n;
  };

  const re = arr => {
    const len = arr.length;
    assert(len !== 0);

    return arr[r(arr.length)];
  };

  const genExpr = function*(opts){
    const callArgsNum = ri();

    const getArgRef = function*(){
      const arg = re(opts.args);
      return new cs.ArgumentRef(arg);
    };

    const getFuncRef = function*(){
      const index = r(opts.funcs.length + 1);

      if(index === opts.funcs.length){
        const optsNew = opts;
        yield [genFunc, optsNew];
      }

      const func = re(opts.funcs);
      return new cs.FunctionRef(func);
    };

    const targetType = opts.args.length !== 0 ? r(2) : 1;

    const target = targetType === 0 ?
      yield [getArgRef] :
      yield [getFuncRef];

    const call = new cs.Call(target);

    for(let i = 0; i !== callArgsNum; i++){
      const optsNew = opts;
      const expr = yield [genExpr, optsNew];

      call.addArg(expr);
    }

    return call;
  };

  const genFunc = function*(opts){
    const id = opts.funcs.length;
    const func = new cs.Function(id);

    opts.funcs.push(func);

    const funcsIndex = opts.funcs.length;
    const argsIndex = opts.args.length;

    const funcArgsNum = ri(1);

    for(let i = 0; i !== funcArgsNum; i++){
      const arg = new cs.Argument(opts.args.length, i === 0);

      func.addArg(arg);
      opts.args.push(arg);
    }

    const optsNew = opts;
    func.expr = yield [genExpr, optsNew];

    for(let i = 0; i !== funcArgsNum; i++)
      opts.args.pop();

    addLocalFuncs: for(let i = funcsIndex; i !== opts.funcs.length; i++){
      const f = opts.funcs[i];
      if(f.parent !== null) return;

      for(let j = 0; j !== funcArgsNum; j++){
        const arg = opts.args[argsIndex + j];

        if(f.hasArgRef(arg)){
          func.addFunc(f);
          continue addLocalFuncs;
        }
      }
    }

    return func;
  };

  const opts = O.nproto({
    depth: 0,
    args: [],
    funcs: [],
  });

  const expr = O.rec(genExpr, opts);
  const prog = new cs.Program(expr, opts.funcs);

  return prog;
};

const clone = function*(obj, extra=null){
  if(typeof obj !== 'object') return obj;
  if(obj === null) return null;

  if(Array.isArray(obj)){
    const arrNew = [];

    for(const elem of obj)
      arrNew.push(yield [clone, elem]);

    if(extra !== null){
      assert(Array.isArray(extra));
      
      for(const elem of extra)
        arrNew.push(elem);
    }

    return arrNew;
  }

  if(O.proto(obj) !== null) return obj;

  const objNew = O.obj();

  for(const key of O.keys(obj))
    objNew[key] = yield [clone, obj[key]];

  if(extra !== null){
    assert(O.proto(extra) === null);

    for(const key of O.keys(extra))
      objNew[key] = extra[key];
  }

  return objNew;
};

module.exports = gen;