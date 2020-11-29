'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const findLeadingZeros = require('.');

const chars = '<>+-';

const main = () => {
  const input = ',[.,]';
  const output = findLeadingZeros(input, chars);

  log(output);
};

main();