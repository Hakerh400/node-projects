'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const xxd = require('../xxd');

const encode = (buf, enc='xxd') => {
  buf = Buffer.from(buf);
  const len = buf.length;

  let n = 1n;

  for(const byte of buf){
    if(byte === 10){
      n = (n + 95n) * 96n + 1n;
      continue;
    }

    assert(byte >= 0x20 && byte <= 0x7e);

    n = (n + BigInt(byte - 0x20)) * 96n + 1n;
  }


  const bytes = [];

  while(n){
    bytes.push(Number(n & 255n));
    n >>= 8n;
  }

  const result = Buffer.from(bytes.reverse());

  if(enc === null) return result;
  if(enc === 'xxd') return xxd.buf2hex(result);
  return result.toString(enc);
};

const decode = buf => {
  O.noimpl('decode');
};

module.exports = {
  encode,
  decode,
};