'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const cwd = __dirname;
const specFile = path.join(cwd, 'spec.txt');

const main = () => {
  const spec = O.rfs(specFile, 1);

  log(spec);
};

main();