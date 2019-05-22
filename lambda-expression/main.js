'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');
const LE = require('.');

setTimeout(main);

function main(){
  let expr, str;

  while(1){
    try{ expr = LE.gen(); }
    catch{ continue; }

    str = expr.toString();
    if(str.length >= 20 && str.length <= 120) break;
  }

  log(str);
}