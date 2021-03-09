'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const parser = require('./parser');
const Database = require('./database');
const Info = require('./info');

const {isSym, isPair} = Database;

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');

const main = () => {
  const src = O.rfs(srcFile, 1);
  const input = O.rfs(inputFile);
  const prog = parser.parse(src);
  const db = new Database();

  log(prog);
};

main();