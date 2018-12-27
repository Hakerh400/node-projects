'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const functasy = require('../functasy');
const frand = require('.');

const START = 10;
const PROB = .9;

const TICKS_NUM = 1e5;

const INPUTS_NUM = 256;
const OUTPUTS_NUM = 2;

setTimeout(main);

function main(){
  while(1){
    var src = frand(START, PROB);
    var outs = new Set();

    for(var i = 0; i !== INPUTS_NUM; i++){
      var input = (i + 1).toString(2).slice(1);
      var out = functasy.run(src, input, functasy.IOBit, 0, TICKS_NUM, 'utf8');
      outs.add(out);
    }

    if(outs.size === 1) continue;
    if(outs.has(null) || outs.size >= OUTPUTS_NUM) break;
  }

  log(src);
  log();
  log(Array.from(outs).map(a => {
    if(a === null) a = '/';
    return `---> ${a}`;
  }).join('\n'));
}