'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const chars = `\r\n\t${O.chars(' ', 95)}`;
const charsObj = O.str2obj(chars);

const recover = (buf, minLen=3) => {
  const byteLen = buf.length;
  const bitLen = byteLen << 3;

  const recover = mode => {
    const getBit = index => {
      const byteIndex = index >> 3;
      if(byteIndex >= byteLen) return 0;

      const bitIndex = index & 7;
      return buf[byteIndex] & (1 << bitIndex) ? 1 : 0;
    };

    const getByte = index => {
      let byte = 0;

      for(let i = 0; i !== 8; i++)
        byte = (byte << 1) | getBit(index + (mode === 0 ? 7 - i : i));

      return byte;
    };

    const getChar = index => {
      return O.sfcc(getByte(index));
    };

    let str = '';
    let i = 0;

    mainLoop: while(i < bitLen){
      let s = '';

      for(let j = 0; j !== minLen; j++){
        const char = getChar(i + (j << 3));

        if(!chars.includes(char)){
          i++;
          continue mainLoop;
        }

        s += char;
      }

      str += s;
      i += minLen << 3;
    }

    return str;
  };

  const str1 = recover(0);
  const str2 = recover(1);

  return str1.length >= str2.length ? str1 : str2;
};

module.exports = {
  recover,
};