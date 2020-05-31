'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const gen = len => {
  const arr = [];

  for(let i = 0; i !== len; i++){
    const sums = new Set();
    arr.forEach(a => arr.forEach(b => sums.add(a + b)));

    let n = 0n;
    while(sums.has(n)) n++;

    arr.push(n);
  }

  return arr;
};

module.exports = {
  gen,
};