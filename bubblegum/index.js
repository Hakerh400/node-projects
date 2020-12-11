'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const xxd = require('../xxd');

const encode = (buf, enc='xxd') => {
  buf = Buffer.from(buf);
  const len = buf.length;

  let n = 0n;

  for(let i = 0; i !== len; i++){
    const byte = buf[i];

    n = n * 96n + 1n;

    if(byte === 10){
      n += 95n
      continue;
    }

    assert(byte >= 0x20 && byte <= 0x7e);

    n += BigInt(byte - 0x20);
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