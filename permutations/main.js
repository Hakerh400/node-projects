'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const permutations = require('.');

const main = () => {
  const str = 'abcba';
  const perms = permutations(str.split(''));

  log(perms.map(a => a.join('')).join('\n'));
};

main();