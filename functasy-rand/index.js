'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const functasy = require('../functasy');
const logStatus = require('../log-status');

const {Serializer, toName} = functasy;

const VERBOSE = 1;

const LENGTH = [1e3, 1e5];
const DEPTH = [20, 50];
const START_LENGTH = 200;

const TICKS_NUM = 1e6;
const TIMEOUTS_NUM = 2;

const INPUTS_NUM = 256;
const OUTPUTS_NUM = 3;

module.exports = {
  gen,
};

function gen(includeOuts=0){
  var n = 0;

  while(1){
    if(VERBOSE) logStatus(++n, null, 'source');

    var len = O.rand(...LENGTH) - 1;
    var src = genSrc(len);
    var start = O.ca(START_LENGTH, () => O.rand(2)).join('');

    var outs = new Set();
    var timeouts = 0;

    log('-'.repeat(80));
    log(src);
    log('-'.repeat(80));

    for(var i = 0; i !== INPUTS_NUM; i++){
      var input = start + i.toString(2).split('').reverse().join('');
      var out = functasy.run(src, input, functasy.IOBit, 1, TICKS_NUM, 'utf8');

      outs.add(out);

      if(out === null){
        if(++timeouts > TIMEOUTS_NUM) break;
      }
    }

    if(outs.size >= OUTPUTS_NUM) break;
  }

  if(VERBOSE) log();

  if(includeOuts) return {src, outs};
  return src;
}

function genSrc(len){
  var s = '(';
  var depth = 1;

  while(s.length + depth < len){
    if(s.endsWith('()(')){ next(); continue; }

    var shouldClose = depth < DEPTH[0] ? O.rand(3) === 0 :
                      depth < DEPTH[1] ? O.rand(2) === 0 :
                      O.rand(3) !== 0;

    if(shouldClose) { close(); continue; }

    next();
  }

  s += ')'.repeat(depth);

  return s;

  function open(){
    s += '(';
    depth++;
  }

  function close(){
    s += ')';
    if(--depth === 0) open();
  }

  function next(){
    if(O.rand(2) === 0) s += toName(r(depth), depth);
    else open();
  }

  function r(n=1){
    return O.rand(n);
  }
}