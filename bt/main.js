'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const readline = require('../readline');

const rl = readline.rl();

const main = () => {
  askFprInput();
};

const askFprInput = () => {
  rl.question('> ', onInput);
};

const onInput = str => {
  str = str.trim();

  if(str === 'q'){
    rl.close();
    return;
  }

  processInput(str);

  log();
  askFprInput();
};

const processInput = str => {
  if(!/^[0-9]+$/.test(str)){
    log('Invalid number');
    return;
  }

  log(`${(
    BigInt(str) + 1n).
      toString(2).
      slice(1).
      split('').
      reverse().
      map(a => `1${a}`).
      join('')
  }0`);
};

main();