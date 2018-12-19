'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fNumber = require('./number');
const fTime = require('./time');
const fPath = require('./path');

module.exports = {
  num: fNumber,
  time: fTime,
  path: fPath,
};