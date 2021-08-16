'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cp = require('child_process');
const assert = require('assert');
const O = require('../omikron');
const Expr = require('./expr');
const Type = require('./type');
const Base = require('./base');
const builtins = require('./builtins');

const {bool} = Type;
const {True, False, b0, b1} = Expr;

const DEBUG = 0;

class CSP extends Base{
  static async solve(formula){
    const csp = new CSP();
    const ctx = vm.createContext(csp);
    const proto = O.proto(csp);

    for(const key of O.keys(proto)){
      const desc = O.desc(proto, key);
      if(!O.has(desc, 'value')) continue;

      const val = desc.value;
      if(typeof val !== 'function') continue;

      ctx[key] = val.bind(ctx);
    }

    vm.runInContext(`result=(()=>{${formula}})()`, ctx);

    if(!await csp.check())
      return null;

    const {result} = ctx;
    const resultNew = O.obj();

    for(const key of O.shuffle(O.keys(result))){
      const expr = result[key];
      resultNew[key] = await csp.solve(expr);
    }

    assert(await csp.check());

    return resultNew;
  }

  decls = [];
  assertions = [];

  constructor(){
    super();

    this.True = True;
    this.False = False;
    this.b0 = b0;
    this.b1 = b1;
  }

  createDecl(type){
    const {decls} = this;
    return this.getDeclName(decls.push(type) - 1);
  }

  createDef(val){
    const {type} = val;
    const name = this.createDecl(type);

    this.assert(this.eq(
      new Expr.Ref(type, name),
      new Expr.Def(val)));

    return name;
  }

  getDeclName(index){
    return `a${index}`;
  }

  assert(expr, index=null){
    assertType(expr, bool);
    const {assertions} = this;

    if(index !== null){
      assert(typeof index === 'number');
      assert(index >= 0 && index < assertions.length);

      assertions[index] = expr;
      return index;
    }

    return assertions.push(expr) - 1;
  }

  undo(index){
    this.assertions.splice(index, 1);
  }

  bool(){
    const name = this.createDecl(bool);
    return new Expr.Ref(bool, name);
  }

  bv(size, val=null){
    if(val === null){
      const type = new Type.BitVec(size);
      const name = this.createDecl(type);

      return new Expr.Ref(type, name);
    }

    return new Expr.BitVec(size, BigInt(val));
  }

  eq(expr1, expr2){
    const {type} = expr1;
    assertType(expr2, type);

    return new Expr.Call(bool, '=', [expr1, expr2]);
  }

  bvext(expr, start, len){
    assert(expr.type.isBv);
    return new Expr.Extract(expr, start, len);
  }

  async check(){
    if(DEBUG){
      log(this.toString());
      log();
    }

    const formula = this.toString();
    const sat = await callZ3(formula);

    if(DEBUG){
      log(sat ? 'sat' : 'unsat');
      O.logb();
    }

    return sat;
  }

  solve(expr){
    return expr.solve(this);
  }

  *toStr(){
    const {decls, defs, assertions} = this;
    const lines = [];

    lines.push(`(set-logic QF_BV)`);

    for(const assertion of assertions){
      for(const expr of O.recg([assertion, 'iterExprs'])){
        if(expr.refsNum <= 1) continue;
        if(expr.ident !== null) continue;

        expr.ident = this.createDef(expr);
      }
    }

    for(let i = 0; i !== decls.length; i++){
      const type = decls[i];
      const name = this.getDeclName(i);

      lines.push(`(declare-const ${name} ${
        yield [[type, 'toStr']]})`);
    }

    for(const assertion of assertions)
      lines.push(`(assert ${yield [[assertion, 'toStr']]})`);

    lines.push(`(check-sat)`);

    return lines.join('\n');
  }
}

const initCSPClass = () => {
  const proto = CSP.prototype;

  const getNamesFromInfo = info => {
    if(typeof info === 'string')
      return [info, info];

    assert(O.isArr(info));
    assert(info.length === 2);

    return info;
  };

  const methodsInfo = {
    unProps(name, a){
      assertType(a, bool);
      return new Expr.Call(bool, name, [a]);
    },

    binProps(name, a, b){
      assertType(a, bool);
      assertType(b, bool);
      return new Expr.Call(bool, name, [a, b]);
    },

    bvRels(name, a, b){
      const {type} = a;
      assert(type.isBv);
      assertType(b, type);
      return new Expr.Call(bool, name, [a, b]);
    },

    bvUnOps(name, a){
      const {type} = a;
      assert(type.isBv);
      return new Expr.Call(type, name, [a]);
    },

    bvBinOps(name, a, b){
      const {type} = a;
      assert(type.isBv);
      assertType(b, type);
      return new Expr.Call(type, name, [a, b]);
    },
  };

  for(const builtinsType of O.keys(methodsInfo)){
    const namesInfo = builtins[builtinsType];
    const func = methodsInfo[builtinsType];

    for(const nameInfo of namesInfo){
      const [name1, name2] = getNamesFromInfo(nameInfo);

      proto[name1] = function(...args){
        return func(name2, ...args);
      };
    }
  }
};

const assertType = (expr, type) => {
  assert(O.rec([expr, 'checkType'], type));
};

const callZ3 = formula => new Promise((res, rej) => {
  (async () => {
    const z3 = cp.spawn('z3', ['-in']);
    const {stdin, stdout, stderr} = z3;

    z3.on('error', rej);
    stdin.on('error', rej);

    const outP = readAllData(stdout);
    const errP = readAllData(stderr);

    stdin.end(formula);

    const [out, err] = await Promise.all([outP, errP]);

    if(err.length !== 0)
      return rej(new Error(err));

    let result = out.trim();

    if(result === 'sat')
      return res(1);

    if(result === 'unsat')
      return res(0);

    rej(new Error(result));
  })().catch(rej);
});

const readAllData = (stream, timeout=null) => {
  return new Promise((res, rej) => {
    const onTimeout = () => {
      stream.destroy();
      rej('timeout');
    };

    const tId = timeout !== null ?
      setTimeout(onTimeout, timeout) : null;

    const bufs = [];

    stream.on('data', buf => {
      bufs.push(buf);
    });

    stream.on('end', buf => {
      if(tId !== null)
        clearTimeout(tId);
      
      res(Buffer.concat(bufs).toString());
    });

    stream.on('error', rej);
  });
};

initCSPClass();

module.exports = CSP;