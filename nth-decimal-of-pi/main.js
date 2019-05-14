'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const nthDecimalOfPi = require('.');

setTimeout(main);

function main(){
  const s = String(O.pi);

  log(s);

  log(O.ca(3, i => {
    if(i < 2) return s[i];
    return nthDecimalOfPi(i - 1);
  }).join(''));
}