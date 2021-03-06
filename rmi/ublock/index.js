'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const rmi = require('..');
const tabs = require('./tabs');
const ublockDir = require('./dir');

const methods = {
  ublockDir,
  tabs,
};

module.exports = methods;