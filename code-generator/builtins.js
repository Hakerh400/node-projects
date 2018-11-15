'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

const MAX_ITERS_NUM = 1e3;

const bs = {
  F0: a => b => b,
  F1: a => b => a,
  EQ: a => b => a === b ? bs.F1 : bs.F0,

  R(bit){
    for(var i = 0; i !== MAX_ITERS_NUM; i++){
      if(bit === bs.F0){
        return global.input ? bs.F1 : bs.F0;
      }

      if(bit === bs.F1){
        var c = global.input[0];
        global.input = global.input.substring(1);
        return +c ? bs.F1 : bs.F0;
      }

      bit = bit(bit);
    }

    throw new RangeError('MAX_ITERS_NUM');
  },

  W(bit){
    for(var i = 0; i !== MAX_ITERS_NUM; i++){
      if(bit === bs.F0){
        global.output += '0';
        break;
      }

      if(bit === bs.F1){
        global.output += '1';
        break;
      }

      bit = bit(bit);
    }

    if(i === MAX_ITERS_NUM)
      throw new RangeError('MAX_ITERS_NUM');

    return bit;
  },
};

module.exports = bs;