'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const get = num => {
  const factors = [];

  for(let i = 2n; i <= num; i++){
    if(num % i === 0n){
      factors.push(i);
      num /= i;
      i--;
    }
  }

  return factors;
};

module.exports = {
  get,
};