'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const calcCrc32 = require('../crc32');
const arrOrder = require('../arr-order');
const logStatus = require('../log-status');

const findZeroCrc32 = (str, chars, start=0n) => {
  let i = start;

  while(1){
    if((~i & 65535n) === 0n)
      logStatus(i, 1n << 32n, 'string');

    const s = str + arrOrder.str(chars, i++);
    if(calcCrc32(s, 0) === 0n) return s;
  }
};

module.exports = findZeroCrc32;