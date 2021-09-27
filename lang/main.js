'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');

const main = () => {
  log('ok');
};

main();