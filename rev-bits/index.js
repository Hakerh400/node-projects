'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const revBits = (a, len=8n) => {
  let b = 0n;

  for(let i = 0n; i !== len; i++){
    b = (b << 1n) + (a & 1n);
    a >>= 1n;
  }

  return b;
};

module.exports = revBits;