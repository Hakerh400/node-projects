'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const gen = require('.');

const MIN_LEN = 10;
const MAX_LEN = 30;

const main = () => {
  log(gen(MIN_LEN, MAX_LEN));
};

main();