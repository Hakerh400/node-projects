'use strict';

var O = require('../framework');

module.exports = {
  bisect,
};

function bisect(func){
  if(!func(0))
    return -1;

  var stage = 0;
  var index = 1;
  var min, max;

  while(func(index))
    index <<= 1;

  min = index >> 1;
  max = index - 1;

  while(min !== max){
    index = (min + max) >> 1;

    if(func(index)){
      min = index + 1;
    }else{
      max = index - 1;
    }
  }

  return min - 1;
}