'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const randOop = require('.');
const Source = require('./source');

const LANG = 'java';

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, `src.${LANG}`);

const main = () => {
  const prog = randOop.gen();
  const src = prog.toString(new Source(LANG));
  O.wfs(srcFile, src);
};

main();