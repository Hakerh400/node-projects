'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Engine = require('./engine');

setTimeout(main);

function main(){
  const lang = 'Test';
  const src = '3*3+4*40*2+5';
  const input = '';
  const expected = String(new Function(`return ${src}`)());

  const eng = new Engine(lang, src);
  const io = new O.IO(input);

  const onRead = (data, len) => {
    if(len & 7){
      if(len !== 1)
        throw new TypeError(`Unsupported data length ${len}`);
      data[0] = io.read();
    }else{
      len >>= 3;
      for(let i = 0; i !== len; i++)
        data[i] = io.read(255);
    }
    return io.hasMore;
  };

  const onWrite = (data, len) => {
    if(len & 7){
      if(len !== 1)
        throw new TypeError(`Unsupported data length ${len}`);
      io.write(data[0]);
    }else{
      len >>= 3;
      for(let i = 0; i !== len; i++)
        io.write(data[i], 255);
    }
  };

  eng.stdout.on('write', onWrite);
  eng.stderr.on('write', onWrite);
  eng.stdin.on('read', onRead);

  eng.run();

  const output = io.getOutput().toString();
  assert.strictEqual(output, expected);

  log('OK');
}