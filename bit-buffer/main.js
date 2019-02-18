'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const BitBuffer = require('.');
const Memory = require('./memory');
const Address = require('./address');

setTimeout(main);

function main(){
  const bb = new BitBuffer();
  const a = new Address();

  a.prepare();
  a.push(1).push(0).push(0).push(0)
   .push(0).push(0).push(0).push(1)
   .push(0).push(0).push(0).push(1)
  log(a);

  bb.dispose();
}