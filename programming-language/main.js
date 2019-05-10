'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Engine = require('./engine');

setTimeout(main);

function main(){
  const lang = 'Test';
  const src = '3*3+4*40*2+5+3*8+11*4+2*67+12345+2*3*4*5+2';
  const input = '';
  const expected = String(new Function(`return ${src}`)());

  const eng = new Engine(lang, src, 30e3);
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
  assert.strictEqual(output, expected);

  log('OK');
}