'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrPeriod = require('.');

const elems = [1, 2];

const main = () => {
  const arr = arrPeriod.gen(elems, 100);
  log(arr.join(''));
};

main();