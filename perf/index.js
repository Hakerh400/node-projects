'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = perf;

function perf(num, func){
  const t = Date.now();
  O.repeat(num, func);
  log(((Date.now() - t) / num).toFixed(3));
}