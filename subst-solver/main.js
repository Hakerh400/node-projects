'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const parser = require('./parser');
const solver = require('./solver');
const cs = require('./ctors');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');

const main = () => {
  const src = O.rfs(srcFile, 1);
  const system = parser.parse(src);

  const rel = system.rels[0];
  const {lhs, rhs} = rel;

  log(O.rec([system, 'sort'])+'');
};

main();