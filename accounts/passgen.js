'use strict';

const O = require('../framework');

const CHAR_FIRST = '!';
const CHAR_LAST = '~';
const CHARS_BLACK_LIST = '()[]{}"';
const CHARS = getChars();

module.exports = {
  gen,
};

function gen(len){
  var str = O.ca(len, () => {
    return O.randElem(CHARS);
  }).join('');

  return str;
}

function getChars(){
  var cc1 = O.cc(CHAR_FIRST);
  var cc2 = O.cc(CHAR_LAST);

  var chars = O.ca(cc2 - cc1 + 1, i => {
    return O.sfcc(cc1 + i);
  });

  chars = chars.filter(char => {
    return !CHARS_BLACK_LIST.includes(char);
  });

  return chars.join('');
}