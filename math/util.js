'use strict';

const assert = require('./assert');
const O = require('../omikron');

const identChars = O.chars('a', 'z');

// let n = 0;
const newSym = () => {
  // n++;
  return Symbol(/*n*/);
};

const copyObj = obj => {
  return Object.assign(O.obj(), obj);
};

const obj2 = () => {
  return [O.obj(), O.obj()];
};

const getAvailIdents = (ctx, strSymObj, mode, num) => {
  const obj = copyObj(strSymObj);

  return O.ca(num, () => {
    const ident = getAvailIdent(ctx, obj, mode);
    obj[ident] = 1;
    return ident;
  });
};

const getAvailIdent = (ctx, strSymObj, mode) => {
  for(let i = 0;; i++){
    const name = genIdent(i, mode);

    if(ctx.hasIdent(name)) continue;
    if(O.has(strSymObj, name)) continue;

    return name;
  }
};

const genIdent = (i, mode=0) => {
  i++;

  // Value
  if(mode === 0)
    return O.arrOrder.str(identChars, i);

  // Type variable
  if(mode === 1)
    return `'τ${getSub(i)}`;

  // Fixed type
  if(mode === 2)
    return `ψ${getSub(i)}`;

  assert.fail();
};

const getSub = i => {
  return Array.from(String(i), n => O.sfcc(0x2080/*0x30*/ | n));
};

const mergeUniq = (obj1, obj2) => {
  const obj = O.obj();

  for(const key of O.keys(obj1))
    obj[key] = obj1[key];

  for(const key of O.keys(obj2)){
    assert(!O.has(obj, key));
    obj[key] = obj2[key];
  }

  return obj;
};

const empty = obj => {
  return O.keys(obj).length === 0;
};

const isStrOrSym = a => {
  return isStr(a) || isSym(a);
};

const isStr = a => {
  return typeof a === 'string';
};

const isSym = a => {
  return typeof a === 'symbol';
};

const isNum = a => {
  return typeof a === 'number';
};

module.exports = {
  identChars,

  newSym,
  copyObj,
  obj2,
  getAvailIdents,
  getAvailIdent,
  genIdent,
  getSub,
  mergeUniq,
  empty,
  isStrOrSym,
  isStr,
  isSym,
  isNum,
};