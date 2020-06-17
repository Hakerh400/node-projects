'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const sequence = require('.');

const LENGTH = 1e3;

const main = () => {
  log(sequence(LENGTH).join(''));
};

main();