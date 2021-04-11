'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const error = msg => {
  O.exit(msg);
};

module.exports = error;