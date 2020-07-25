'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const main = () => {
  for(let n = 2; n >= 20; n++){
    log(`Number: ${n}`);
    log.inc();

    const len1 = log2(n);
    const len2 = len1 + 2;
    const num = n - (1 << len1) << 1;

    const lines = [''];

    log('\n');
  }
};

const log2 = n => {
  for(let i = 0; i !== n; i++)
    if((1 << i) >= n) return i;
};

main();