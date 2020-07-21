'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const {min, max} = Math;

const gen = (elems, len) => {
  const arr = [];

  for(let i = 0; i !== len; i++)
    arr.push(next(elems, arr));

  return arr;
};

const next = (elems, arr) => {
  const num = elems.length;
  const num2 = num * 2;
  const num21 = num * 2 - 1;
  const len = arr.length;
  const len1 = len - 1;
  const end = min(num2, len);
  const seen = new Set();

  for(let i = 0; i !== end; i++){
    const elem = arr[len1 - i];

    if(seen.has(elem)) continue;
    if(i === num21) return elem;

    seen.add(elem);
  }

  if(seen.size !== num)
    return O.randElem(elems.filter(a => !seen.has(a)));

  return O.randElem(elems);
};

module.exports = {
  gen,
  next,
};