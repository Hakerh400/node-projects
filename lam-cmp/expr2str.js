'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const combs = require('./combs');

const {
  nativeCombs,
  isNative,
  isSpecial,
  isComb,
  isCall,
} = combs;

const {K, S, I, iota} = nativeCombs;

const IDENT_PARENS = 0;

const nativeNames = {
  [K]: 'K',
  [S]: 'S',
  [I]: 'I',
  [iota]: 'i',
};

const identChars = O.chars('A', 26);
const idents = O.obj();

let identsNum = 0;

const expr2str = function*(expr, parens=0){
  if(isComb(expr)){
    if(isNative(expr))
      return intoBrackets(nativeNames[expr]);

    if(!O.has(idents, expr))
      idents[expr] = arrOrder.str(identChars, ++identsNum);

    return intoBraces(idents[expr]);
  }

  let str = '';

  for(let i = 0; i !== expr.length; i++){
    const first = i === 0;
    if(!first) str += ' ';

    const e = expr[i];
    str += yield [expr2str, e, !first && e.length > 1];
  }

  return parens ? intoParens(str, 1) : str;
};

const intoParens = (str, force) => {
  return wrapInto(str, '()', force);
};

const intoBrackets = (str, force) => {
  return wrapInto(str, '[]', force);
};

const intoBraces = (str, force) => {
  return wrapInto(str, '{}', force);
};

const wrapInto = (str, [c1, c2], force) => {
  if(!(IDENT_PARENS || force)) return str;
  return `${c1}${str}${c2}`;
};

module.exports = expr2str;