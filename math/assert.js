'use strict';

const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

const assert = b => {
  if(b) return;

  debugger;
  throw new Error('Assertion failed');
};

module.exports = Object.assign(assert, {});