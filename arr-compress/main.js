'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const acomp = require('.');

const main = () => {
  const input = [1, 55, 55, 1, 54, 54, 2, 56, 56, 56, 5, 0, 1, 0, 1, 0, 1, 7, 58, 58, 58, 58, 53, 57, 57, 57, 59, 59, 59, 59, 0];
  const expected = '10'.repeat(1728);
  const actual = acomp.decompress(input).join('');

  assert(actual === expected);
  log('ok');
};

main();