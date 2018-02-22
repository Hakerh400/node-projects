'use strict';

var O = require('../framework');

var availableChars = getAvailableChars();

module.exports = {
  generate,
  getCharOffset,
};

function getAvailableChars(){
  return [
    [
      ...O.ca(26, i => getCharOffset('a', i)),
      ...O.ca(26, i => getCharOffset('A', i)),
    ],

    O.ca(10, i => getCharOffset('0', i)),
  ];
}

function generate(i, cs = availableChars){
  if(!i) return '';

  var len1 = cs[0].length;
  var len = len1 + cs[1].length;
  var str = '';

  while(i){
    i--;

    var currLen = len;
    if(i >= len1 && i < len) currLen = len1;

    var index = i % currLen;
    var type = 0;

    if(index >= len1){
      index -= len1;
      type = 1;
    }

    str = cs[type][index] + str;
    i = i / currLen | 0;
  }

  return str;
}

function getCharOffset(char, offset){
  return String.fromCharCode(char.charCodeAt(0) + offset);
}