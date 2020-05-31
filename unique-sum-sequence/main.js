'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const uniqueSumSequence = require('.');

const LENGTH = 100;

const main = () => {
  const arr = uniqueSumSequence.gen(LENGTH);
  log(arr.map(a => Number(a)));
};

main();