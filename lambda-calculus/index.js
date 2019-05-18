'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const G = (...a) => (a.a = 0, a);
const F = (...a) => (a.a = 1, a);

module.exports = {
  G, F,

  reduce,
  cmp,

  map,
  vec,

  str,
  show,
};

function reduce(expr){
  if(expr.a) expr = G(expr);
  else expr = slice(expr);

  while(!(expr.length === 1 && expr[0].a)){
    if(!expr[0].a){
      const group = expr.shift();

      for(let i = group.length - 1; i !== -1; i--)
        expr.unshift(group[i]);

      continue;
    }

    const func = expr.shift();
    const arg = expr.shift();

    const subst = (nest, e) => {
      if(!vec(e)){
        if(e === nest) return arg;
        return e;
      }

      nest += e.a;

      return map(e, e => subst(nest, e));
    };

    for(let i = func.length - 1; i !== -1; i--)
      expr.unshift(subst(0, func[i]));
  }

  return expr;
}

function cmp(expr1, expr2){
  const e1 = reduce(expr1);
  const e2 = reduce(expr2);

  const cmp = (e1, e2) => {
    if(!(vec(e1) && vec(e2))) return e1 === e2;
    return e1.length === e2.length && e1.every((e, i) => {
      return cmp(e, e2[i]);
    });
  };

  return cmp(e1, e2);
}

function slice(expr){
  const s = expr.slice();
  s.a = expr.a;
  return s;
}

function map(expr, func){
  const m = expr.map(func);
  m.a = expr.a;
  return m;
}

function vec(e){
  return Array.isArray(e);
}

function str(expr, top=1){
  if(!vec(expr)) return String(expr);
  const p = expr.a || !(top || expr.length === 1) ? expr.a ? ['(', ')'] : ['[', ']'] : ['', ''];
  return `${p[0]}${expr.map(e => str(e, expr.a)).join(' ')}${p[1]}`;
}

function show(expr){
  log(str(expr));
}