'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const gen = require('.');
const cs = require('./ctors');

const cwd = __dirname;
const dir = path.join(cwd, 'test');
const codeFile = path.join(dir, 'code.txt');

const main = () => {
  const seed = O.rand(1e5);
  const ser = new O.NatSerializer(BigInt(seed));
  const prog = gen(/*ser*/);
  const code = prog.toString();

  O.wfs(codeFile, code);
};

main();