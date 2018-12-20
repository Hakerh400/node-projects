'use strict';

const fs = require('fs');
const path = require('path');
const v8 = require('v8');
const O = require('../omikron');

const header = Buffer.from('FF0D', 'hex');

const start = 0;
const prob = .9;

module.exports = randVal;

function randVal(s=start, p=prob){
  while(1){
    var buf = genBuf(s, p);

    try{
      var val = v8.deserialize(buf);
      return val;
    }catch{}
  }
}

function genBuf(s=start, p=prob){
  var len = O.randInt(s, p);
  var arr = O.ca(len, () => O.rand(256));
  var buf = Buffer.from(arr);

  return Buffer.concat([header, buf]);
}