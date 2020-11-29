'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const findZeroCrc32 = require('.');

const chars = '<>+-';

const main = () => {
  const input = ',[.,]';
  const output = findZeroCrc32(input, chars);

  log(output);
};

main();