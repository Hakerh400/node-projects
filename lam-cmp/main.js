'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const combs = require('./combs');
const expr2str = require('./expr2str');

const {
  nativeCombs,
  isNative,
  isSpecial,
  isComb,
  isCall,
} = combs;

const {K, S, I, iota} = nativeCombs;

const DEBUG = 1;
const STEPS_LIMIT = 1e5;

const main = () => {
  const i = iota;

  const _I = [i, i];
  const _iI = [i, _I];
  const _K = [i, _iI];
  const _S = [i, _K];

  const f1 = [S, I, I];
  const f2 = [f1, f1];

  const exprsObj = {
    _I,
    _iI,
    _K,
    _S,
    f1,
    f2,
  };

  const exprsArr = O.vals(exprsObj);
  const exprsMap = O.keys(exprsObj).map(a => [exprsObj[a], a]);

  const equivClasses = [];

  const expr1 = [_iI];
  const expr2 = [K, I];

  const stepsNum = [STEPS_LIMIT];
  const eq = O.rec(cmp, expr1, expr2, stepsNum);

  if(eq === null){
    log('unknown');
    return;
  }

  log(eq ? 'equal' : 'not equal');

  log();
  log(`Steps: ${STEPS_LIMIT - stepsNum[0]}`);
};

const cmp = function*(expr1, expr2, stepsNum){
  const exprs = [[expr1], [expr2]];

  let needArgs = 0;
  let simplified = 1;
  let limitReached = 0;

  const iter = func => {
    for(const expr of exprs)
      func(expr);
  };

  const simplify = expr => {
    if(expr.length === 0){
      needArgs = 1;
      return;
    }

    while(1){
      if(stepsNum[0] === 0){
        limitReached = 1;
        return;
      }

      stepsNum[0]--;

      const target = expr[0];

      if(isCall(target)){
        expr.shift();

        for(let i = target.length - 1; i !== -1; i--)
          expr.unshift(target[i]);

        continue;
      }

      if(isSpecial(target))
        break;

      const argsNum = expr.length - 1;

      if(target === K){
        if(argsNum < 2){
          needArgs = 2 - argsNum;
          break;
        }

        expr.shift();
        const x = expr.shift();
        expr.shift();
        expr.unshift(x);

        if(DEBUG) {simplified = 0; break;}
        else continue;
      }

      if(target === S){
        if(argsNum < 3){
          needArgs = 3 - argsNum;
          break;
        }

        expr.shift();
        const x = expr.shift();
        const y = expr.shift();
        const z = expr.shift();
        expr.unshift(x, z, [y, z]);

        if(DEBUG) {simplified = 0; break;}
        else continue;
      }

      if(target === I){
        if(argsNum < 1){
          needArgs = 1 - argsNum;
          break;
        }

        expr.shift();

        if(DEBUG) {simplified = 0; break;}
        else continue;
      }

      if(target === iota){
        if(argsNum < 1){
          needArgs = 1 - argsNum;
          break;
        }

        expr.shift();
        const x = expr.shift();
        expr.unshift(x, S, K);

        if(DEBUG) {simplified = 0; break;}
        else continue;
      }

      assert.fail(target);
    }
  };

  const addArg = (expr, arg) => {
    expr.push(arg);
  };

  while(1){
    if(DEBUG){
      iter(logExpr);
      log();
    }

    needArgs = 0;
    simplified = 1;

    iter(simplify);

    if(limitReached)
      return null;

    if(needArgs){
      while(needArgs--){
        const arg = Symbol();

        iter(expr => {
          addArg(expr, arg);
        });
      }

      continue;
    }

    if(!simplified) continue;

    const target1 = exprs[0][0];
    const target2 = exprs[1][0];

    if(isCall(target1) || isCall(target2))
      continue;

    if(isSpecial(target1) || isSpecial(target2)){
      const [expr1, expr2] = exprs;

      if(target1 !== target2) return 0;
      if(expr1.length !== expr2.length) return 0;

      iter(expr => expr.shift());

      for(let i = 0; i !== expr1.length; i++){
        if(DEBUG) log.inc();
        const eq = yield [cmp, expr1[i], expr2[i], stepsNum];
        if(DEBUG) log.dec();

        if(eq === null) return null;
        if(!eq) return 0;
      }

      if(DEBUG) log.dec();
      return 1;
    }
  }
};

const logExpr = expr => {
  log(O.rec(expr2str, expr));
};

main();