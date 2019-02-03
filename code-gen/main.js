'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const {IO} = require('../functasy');
const CodeGenerator = require('.');

setTimeout(main);

function main(){
  const io = new IO('ABC');
  const gen = new CodeGenerator();

  gen.addFunc('read', [], 'bool', () => {
    return io.read();
  });

  gen.addFunc('write', ['bool'], null, bit => {
    io.write(bit);
  });
}