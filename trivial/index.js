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

  const ri = () => {
    let n = 0;
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
        const optsNew = yield [clone, opts];
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
      const optsNew = yield [clone, opts];
      const expr = yield [genExpr, optsNew];

      call.addArg(expr);
    }

    return call;
  };

  const genFunc = function*(opts){
    const id = opts.funcs.length;
    const func = new cs.Function(id);
    opts.funcs.push(func);

    const funcArgsNum = ri();

    for(let i = 0; i !== funcArgsNum; i++)
      opts.args.push(new cs.Argument(opts.args.length));

    const optsNew = yield [clone, opts];
    func.expr = yield [genExpr, optsNew];

    for(let i = 0; i !== funcArgsNum; i++)
      opts.args.pop();

    return func;
  };

  return O.rec(genExpr, O.nproto({
    depth: 0,
    args: [],
    funcs: [],
  }));
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