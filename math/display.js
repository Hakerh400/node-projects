'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Theory = require('./theory');
const util = require('./util');
const su = require('./str-util');

class Display{
  tabs = [];
}

module.exports = Display;