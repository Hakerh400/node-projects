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

  bb.write(a.set(1e7).shl(100), 1);
  bb.read(a.set(1e7).shl(100).dec());
  bb.read(a.set(1e7).shl(100));
  bb.read(a.set(1e7).shl(100).inc());

  const t = Date.now();
  bb.write(a.set(1e7).shl(100), 1);
  bb.read(a.set(1e7).shl(100).dec());
  bb.read(a.set(1e7).shl(100));
  bb.read(a.set(1e7).shl(100).inc());
  log(((Date.now() - t) / 1e3).toFixed(3));

  bb.dispose();
}