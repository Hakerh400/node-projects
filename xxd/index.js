'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const options = {
  offsetPad: 4n,
  cols: 16n,
  group: 1n,
  upperCase: 0,
};

const buf2hex = (buf, opts) => {
  opts = Object.assign(O.obj(), options, opts);

  const {
    offsetPad,
    cols,
    group,
    upperCase,
  } = opts;

  assert(offsetPad > 0n);
  assert(cols > 0n);
  assert(group > 0n);
  assert(cols % group === 0n);

  const bufLen = BigInt(buf.length);
  if(bufLen === 0n) return '';

  const toHex = (num, pad) => {
    const pad2 = pad << 1n;
    if(num === null) return repeat(' ', pad2);

    let str = padStart(num.toString(16), pad2, '0');
    if(upperCase) str = str.toUpperCase();
    
    return str;
  };

  const linesNum = ceil(bufLen, cols);
  const offsetMaxMax = (1n << (offsetPad << 3n)) - 1n;
  const offsetMax = linesNum * cols - 1n;
  assert(offsetMax <= offsetMaxMax);

  const lines = [];

  for(let y = 0n; y !== linesNum; y++){
    const offset = y * cols;
    const offsetStr = toHex(offset, offsetPad);

    const caStr = (f, sep='') => {
      return O.ca(Number(cols), xNum => {
        const x = BigInt(xNum);
        const xx = offset + x;
        const byte = xx < bufLen ? buf[xx] : null;
        
        return f(byte, x);
      }).join(sep);
    };

    const colsStr = caStr((byte, x) => {
      const sep = x % group === 0n ? ' ' : '';
      return `${toHex(byte, 1n)}${sep}`;
    });

    const asciiStr = caStr((byte, x) => {
      if(byte === null) return '';
      if(byte >= 0x20 && byte <= 0x7e) return O.sfcc(byte);
      return '.';
    });

    const line = `${offsetStr}: ${colsStr} ${asciiStr}`;
    lines.push(line);
  }

  return lines.join('\n');
};

const hex2buf = str => {
  O.noimpl('hex2buf');
};

const padStart = (str, targetLen, char=' ') => {
  const strLen = BigInt(str.length);

  assert(targetLen >= strLen);
  assert(char.length === 1);

  return `${repeat(char, targetLen - strLen)}${str}`;
};

const repeat = (str, num) => {
  let s = '';
  while(num--) s += str;
  return s;
};

const ceil = (x, y) => {
  if(x % y === 0n) return x / y;
  return x / y + 1n;
};

module.exports = {
  buf2hex,
  hex2buf,
};