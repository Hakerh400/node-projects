'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const calcCrc = (n, d, invert=null) => {
  n = BigInt(n);
  d = BigInt(d);

  assert(n >= 0n);
  assert(d > 0n);

  const dOrd = getOrder(d);
  const mask = (1n << dOrd) - 1n;

  n <<= dOrd;

  if(n === 0n && invert === 0n)
    return 0n;

  if(invert !== null)
    n ^= mask * (1n << invert);

  if(n === 0n) return 0n;

  const size = getOrder(n);
  let mult = 1n << size;

  while(n > mask){
    while(!(n & mult)) mult >>= 1n;
    n ^= (mult >> dOrd) * d;
  }

  return (invert ? ~n : n) & mask;
};

const getOrder = n => {
  assert(n > 0n);

  let i = 0n;

  while(n !== 1n){
    n >>= 1n;
    i++;
  }

  return i;
};

const show = n => {
  log(n.toString(2).padStart(56, '0').match(/.{8}/g).join(' '));
  return n;
};

module.exports = calcCrc;