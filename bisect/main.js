'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const bisect = require('.');

main();

function main(){
  const i = bisect('in', i => {
    if(i <= 12345) return 'in';
    return 'out';
  });
  log(i);
}