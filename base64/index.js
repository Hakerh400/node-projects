'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = {
  encode,
  decode,
}

function encode(data){
  const buf = Buffer.from(data);

  let str = '';
  let val = 0;

  buf.forEach((byte, i) => {
    switch(i % 3){
      case 0:
        str += char(byte >> 2);
        val = (byte & 3) << 4;
        break;

      case 1:
        str += char((byte >> 4) | val);
        val = (byte & 15) << 2;
        break;

      case 2:
        str += char((byte >> 6) | val);
        str += char(byte & 63);
        break;
    }
  });

  const m = buf.length % 3;
  if(m !== 0) str += char(val) + '='.repeat(3 - m);

  return str;
}

function decode(str){
  const pad = str.match(/\=*$/)[0].length;
  const extraBytes = pad !== 0 ? pad : 0;
  const len = (str.length >> 2) * 3 - extraBytes;
  const buf = Buffer.alloc(len);

  str += str;

  let j = 0;
  let val = 0;

  for(let i = 0; i !== len; i++){
    let byte = 0;

    switch(i % 3){
      case 0:
        byte = ord(str[j++]) << 2;
        val = ord(str[j++]);
        byte |= val >> 4;
        break;

      case 1:
        byte = val << 4;
        val = ord(str[j++]);
        byte |= val >> 2;
        break;

      case 2:
        byte = (val << 6) | ord(str[j++]);
        break;
    }

    buf[i] = byte;
  }

  return buf;
}

function char(ord){
  if(ord === 62) return '+';
  if(ord === 63) return '/';

  return O.sfcc(ord + (
    ord < 26 ? 65 :
    ord < 52 ? 71 :
    -4
  ));
}

function ord(char){
  if(char === '+') return 62;
  if(char === '/') return 63;

  const cc = O.cc(char);

  return cc + (
    cc < 65 ? 4 :
    cc < 97 ? -65 :
    -71
  );
}