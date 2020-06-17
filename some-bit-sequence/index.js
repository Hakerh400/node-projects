'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const sequence = len => {
  const arr = [];

  for(const bit of generator()){
    arr.push(bit);
    if(arr.length === len) break;
  }

  return arr;
};

const generator = function*(){
  const a = [0];
  let i = 0;

  yield 0;

  while(1){
    const b = [...a.slice(1), a[0]];

    if(++i & 1){
      b[0] = 1;
      O.setLast(b, 1);
    }

    for(const bit of b){
      a.push(bit);
      yield bit | 0;
    }
  }
};

module.exports = sequence;