'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

const cwd = __dirname;
const logicDir = path.join(cwd, 'logic');

const config = {
  logicDir,
};

module.exports = config;