'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const parser = require('./parser');
const cs = require('./ctors');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');

const main = () => {
  const src = O.rfs(srcFile, 1);
  const system = parser.parse(src);

  log(system.toString());
};

main();