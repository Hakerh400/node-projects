'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

module.exports = {
  calc,
};

function calc(n1, n2, base){
  if(n1 === 0 && n2 === 0)
    return 0;

  const a1 = [];
  const a2 = [];

  while(n1 !== 0){
    a1.push(n1 % base);
    n1 = n1 / base | 0;
  }

  while(n2 !== 0){
    a2.push(n2 % base);
    n2 = n2 / base | 0;
  }

  var num = 0;

  while(!(a1.length === a2.length && O.last(a1) === O.last(a2))){
    inc(a1, base);
    inc(a2, base);
    num++;
  }

  return num;
}

function inc(arr, base){
  for(var i = 0; i !== arr.length; i++){
    if(arr[i] === base - 1){
      arr[i] = 0;
      continue;
    }

    arr[i]++;
    return arr;
  }

  arr.push(1);
  return arr;
}