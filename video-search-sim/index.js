'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const gen = (len=null, arrLen=1e3) => {
  if(len === null) len = O.randInt();

  const obj = O.obj();
  const arr = [];
  let index = 0;

  while(index !== len){
    arr.push(
      index in obj ?
        obj[index] :
        obj[index] = O.obj()
    );

    if(arr.length < arrLen) index -= O.randInt(-1);
    else index++;
  }

  return arr;
};

const calc = arr => {
  const map = new Map();

  arr.forEach((elem, index) => {
    map.set(elem, index);
  });

  let len = 0;
  let index = 0;

  while(index !== arr.length){
    const elem = arr[index];
    index = map.get(elem) + 1;
    len++;
  }

  return len;
};

module.exports = {
  gen,
  calc,
};