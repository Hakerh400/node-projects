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
  const input = 'abcde';

  const maxSize = 1e7;
  const eng = new Engine(lang, src, maxSize, maxSize - 1e3);
  const io = new O.IO(input);

  const onRead = (buf, len) => {
    buf[0] = io.read();
    return io.hasMore();
  };

  const onWrite = (buf, len) => {
    io.write(buf[0]);
  };

  eng.stdout.on('write', onWrite);
  eng.stdin.on('read', onRead);

  eng.stderr.on('write', (buf, len) => {
    log(buf.toString());
  });

  eng.run();

  const output = io.getOutput().toString();
  log(output);
}