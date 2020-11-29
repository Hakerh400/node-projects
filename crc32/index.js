'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const calcCrc = require('../crc');
const revBits = require('../rev-bits');

const d = 0x104C11DB7n;

const calcCrc32 = (input, toBuf=1) => {
  const buf = Buffer.from(input);
  const len = BigInt(input.length);
  const len1 = len - 1n;

  const n = buf.reduce((a, b, c) => {
    return a + (revBits(BigInt(b)) << (len1 - BigInt(c) << 3n));
  }, 0n);

  const r = revBits(calcCrc(n, d, len << 3n), 32n);
  if(!toBuf) return r;

  return Buffer.from(O.ca(4, i => {
    return Number((r >> (3n - BigInt(i) << 3n)) & 255n);
  }));
};

module.exports = calcCrc32;