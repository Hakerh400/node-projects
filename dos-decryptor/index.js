'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const cwd = __dirname;
const charsFile = path.join(cwd, 'chars.txt');

const chars = (chars => {
  return chars.match(/[0-9A-F]{4}/g).map(charCode => {
    return O.sfcc(parseInt(charCode, 16));
  });
})(O.rfs(charsFile, 1));

const charsObj = (() => {
  const obj = O.obj();

  chars.forEach((char, index) => {
    obj[char] = index;
  });

  return obj;
})();

const decrypt = str => {
  const arr = [];

  for(const char of str){
    if(!(char in charsObj)){
      arr.push(O.cc(char));
      continue;
    }

    const code = charsObj[char];
    arr.push(code);
  }

  return Buffer.from(arr).toString('utf8');
};

module.exports = {
  decrypt,
};