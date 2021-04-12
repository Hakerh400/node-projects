'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const udecode = require('../ublock-decode');

const strsRaw = {
  m: '1509;,=8*',
};

const strs = O.obj();

for(const key of O.keys(strsRaw))
  strs[key] = udecode(strsRaw[key]);

module.exports = strs;