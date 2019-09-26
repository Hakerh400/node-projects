'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const name = (a, b) => `${a}${b + 1}`;

const names = {
  class(i){   return name('Class', i); },
  generic(i){ return name('T',     i); },
  arg(i){     return name('arg',   i); },
};

module.exports = names;