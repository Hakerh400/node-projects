'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const textRecovery = require('.');

const main = () => {
  const original = 'Hello, World!';
  const bits = O.str2bits(original);
  const buf = O.bits2buf(bits);
  const text = textRecovery.recover(buf);

  log(text);
};

main();