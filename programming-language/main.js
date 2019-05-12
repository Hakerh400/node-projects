'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');
const Engine = require('./engine');

setTimeout(main);

function main(){
  const lang = 'Functional()';
  const src = O.rfs(format.path('-dw/1.txt'), 1);
  const input = '';

  const maxSize = 1e5;
  const eng = new Engine(lang, src, maxSize, maxSize - 1e3);
  const bufs = [];

  const onRead = (buf, len) => {
    buf.fill(0);
    return 0;
  };

  const onWrite = (buf, len) => {
    bufs.push(buf);
  };

  eng.stdout.on('write', onWrite);
  eng.stderr.on('write', onWrite);
  eng.stdin.on('read', onRead);

  eng.run();

  const output = Buffer.concat(bufs).toString();
  log(output);
}