'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = nthDecimalOfPi;

function nthDecimalOfPi(n){
  n = BigInt(n - 1);

  const s = 10n ** ((n >> 1n) + 5n);
  const s2 = s * s;

  let sum = 0n;
  let x = 0n;

  for(let y = s - 1n; y !== -1n; y--){
    const m = s2 - y * y;

    let x1 = x;
    let x2 = s - 1n;

    while(x2 - x1 > 1n){
      x = x1 + x2 >> 1n;
      if(x * x < m) x1 = x;
      else x2 = x;
    }

    sum += x1;
  }

  log(sum);
  log(sum * 4n);
  log((sum - s * 1n) * 4n);
  log((sum - s * 2n) * 4n);

  return (((sum << 2n) - s2 * 3n) * 10n ** (n + 1n) + (s2 >> 1n)) / s2 % 10n;
}