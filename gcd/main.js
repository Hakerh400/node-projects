'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const gcd = require('.');

const main = () => {
  const a = 1071n;
  const b = 462n;

  log(gcd(a, b));
};

main();