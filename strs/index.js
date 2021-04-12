'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const udecode = require('../ublock-decode');

const encoded = {
  m: '1509;,=8*',
};

const strs = O.obj();

for(const key of O.keys(encoded))
  strs[key] = udecode(encoded[key]);

module.exports = strs;