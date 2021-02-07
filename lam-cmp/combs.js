'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const {K, S, I, iota} = O.symbols;
const nativeCombs = {K, S, I, iota};

const combsObj = O.arr2obj([K, S, I, iota]);

const isNative = comb => {
  assert(isComb(comb));
  return O.has(combsObj, comb);
};

const isSpecial = comb => {
  return !isNative(comb);
};

const isComb = a => {
  return !isCall(a)
};

const isCall = a => {
  return Array.isArray(a);
};

module.exports = {
  nativeCombs,

  isNative,
  isSpecial,
  isComb,
  isCall,
};