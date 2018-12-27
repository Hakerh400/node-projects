'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const {Serializer, toName} = require('../functasy');

const START = 10;
const PROB = .9;

module.exports = gen;

function gen(start=START, prob=PROB){
  var buf = genBuf(start, prob);
  var ser = new Serializer(buf);

  var depth = 0;
  var s = '';

  while(ser.hasMore() || depth !== 0){
    if(depth === 0){
      open();
      continue;
    }

    if(s.slice(-3) !== '()(' && !r()){
      close();
      continue;
    }

    if(!r()){
      s += toName(r(depth - 1));
      continue;
    }

    open();
  }

  return s;

  function open(){
    s += '(';
    depth++;
  }

  function close(){
    s += ')';
    depth--;
  }

  function r(n=1){
    return ser.read(n);
  }
}

function genBuf(start, prob){
  var len = O.randInt(start, prob);
  return Buffer.from(O.ca(len, () => O.rand(256)));
}