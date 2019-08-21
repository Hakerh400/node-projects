'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const bisect = (a, f) => {
  if(f(0) !== a) return 0;

  let i = 0, j = 1;
  while(f(j) === a){
    i = j;
    j *= 2;
  }

  while(i !== j){
    const k = Math.ceil((i + j) / 2);
    if(f(k) === a) i = k;
    else j = k - 1;
  }

  return i;
};

module.exports = bisect;