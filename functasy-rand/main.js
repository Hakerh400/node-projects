'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const frand = require('.');

setTimeout(main);

function main(){
  O.enhanceRNG();

  var {src, outs} = frand.gen(1);

  log(src);
  log();

  for(var out of outs){
    if(out === null) out = '/';
    log(`---> ${out}`);
  }

  log();
  log(src);
}