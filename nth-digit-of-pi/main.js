'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');

const DIGITS_NUM = 7;

const main = () => {
  log(`3.${O.ca(DIGITS_NUM, i => getDigit(i)).join('')}`);
};

const getDigit = digitIndex => {
  const n = BigInt(digitIndex) + 1n;
  assert(n >= 1n);

  const n10 = 10n ** n;
  const r = 8n * n10 + 1n;
  const r2 = r * r;

  let sum = 0n;
  let x = 0n;

  for(let y = r - 1n; y !== -1n; y--){
    const y2 = y * y;
    const d = r2 - y2;

    let x1 = x;
    let x2 = r;

    while(x2 - x1 >= 2n){
      let x3 = x1 + x2 >> 1n;
      if(x3 * x3 < d) x1 = x3;
      else x2 = x3;
    }

    if(x1 === x2 || x2 * x2 < d) x = x2;
    else x = x1;

    sum += x;
  }

  return Number(4n * n10 * sum / r2 % 10n);
};

main();