'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Database = require('./database');
const Info = require('./info');
const cs = require('./expression');

const cwd = __dirname;
const testDir = path.join(cwd, 'test');

const main = () => {
  const A = Symbol('A');
  const B = Symbol('B');

  const db = new Database();

  const a = db.getInfo(new cs.Symbol(A));
  const b = db.getInfo(new cs.Symbol(B));
  const c = db.getInfo(new cs.Pair(a, b));

  log(c)
};

main();