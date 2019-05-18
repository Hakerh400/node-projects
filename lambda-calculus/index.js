'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = {
  reduce,

  map,
  str,
};

function reduce(expr){
  expr = slice(expr);


  while(!(expr.length === 1 && expr[0].a)){
    if(!expr[0].a){
      const group = expr.shift();

      for(let i = group.length - 1; i !== -1; i--)
        expr.unshift(group[i]);

      continue;
    }

    log(str(expr));

    const func = expr.shift();
    const arg = expr.shift();

    const subst = (nest, e) => {
      if(!Array.isArray(e)){
        if(e === nest) return arg;
        return e;
      }

      nest += e.a;

      return map(e, e => subst(nest, e));
    };

    for(let i = func.length - 1; i !== -1; i--)
      expr.unshift(subst(0, func[i]));
  }

  log(str(expr));
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

function str(expr, top=1){
  if(!Array.isArray(expr)) return String(expr);
  const p = expr.a || !(top || expr.length === 1) ? expr.a ? ['(', ')'] : ['[', ']'] : ['', ''];
  return `${p[0]}${expr.map(e => str(e, expr.a)).join(' ')}${p[1]}`;
}