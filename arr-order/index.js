'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = {
  arr,
  id,
}

function arr(vals, id, dir=1){
  const n = BigInt(vals.length);
  const arr = [];

  id = BigInt(id);

  while(id !== 0n){
    let val = vals[--id % n];
    id /= n;

    if(dir) arr.push(val);
    else arr.unshift(val);
  }

  return arr;
}

function id(vals, arr, dir=1){
  const n = BigInt(vals.length);
  const len = arr.length;
  const map = new Map();

  let id = 0n;

  let start = dir ? len - 1 : 0;
  let end = dir ? -1 : len;
  let d = dir ? -1 : 1;

  vals.forEach((val, index) => {
    map.set(val, BigInt(index));
  });

  for(let index = start; index !== end; index += d){
    let val = arr[index];
    id = id * n + BigInt(map.get(val)) + 1n;
  }

  return id;
}