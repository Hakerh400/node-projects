'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const O = require('../omikron');

module.exports = inspect;

function inspect(val){
  return util.inspect(val, {depth: Infinity});
}