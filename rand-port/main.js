'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const RANGE = [1024, 49151];

const main = () => {
  O.enhanceRNG();
  log(O.rand(...RANGE));
};

main();