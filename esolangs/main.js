'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const esolangs = require('../../esolangs');

const cwd = __dirname;
const langFile = path.join(cwd, 'lang.txt');

const main = () => {
  const name = O.rfs(langFile, 1);
  const info = esolangs.getInfo(name);
  assert(info !== null);

  const {id} = info;
  const script = path.join(cwd, id);

  require(script);
};

main();