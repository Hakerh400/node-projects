'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const tabs = require('./tabs');

const ublock = {
  tabs,
};

module.exports = ublock;