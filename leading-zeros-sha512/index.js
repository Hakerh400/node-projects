'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const calcHash = require('../hash');
const arrOrder = require('../arr-order');
const logStatus = require('../log-status');

const findLeadingZeros = (str, chars, start=0n) => {
  let i = start;

  loop: while(1){
    if((~i & 65535n) === 0n)
      logStatus(i, 1n << 35n, start, 'string');

    const s = str + arrOrder.str(chars, i++);
    const hash = calcHash(s, 'sha512');

    for(let i = 0; i !== 4; i++)
      if(hash[i] !== 0)
        continue loop;

    return s;
  }
};

module.exports = findLeadingZeros;