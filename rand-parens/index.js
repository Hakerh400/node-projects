'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const r = O.rand;

const gen = (minLen, maxLen=null) => {
  while(1){
    let str = '';
    let depth = 0;

    while(1){
      if(maxLen !== null && str.length > maxLen){
        str = '';
        depth = 0;
      }

      if(r()){
        str += '(';
        depth++;
      }else if(depth !== 0){
        str += ')';
        depth--;
      }else{
        break;
      }
    }

    if(minLen !== null && str.length >= minLen)
      return str;
  }
};

module.exports = gen;