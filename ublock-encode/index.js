'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const encode = str => {
  return str.split('').
    map(a => O.cc(a) - 32).
    map(a => 94 - a).
    map(a => O.sfcc(a + 32)).
    join('');
};

module.exports = encode;