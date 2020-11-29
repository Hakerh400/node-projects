'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const calcHash = require('../hash');

O.bion(1);

const main = () => {
  let str = Buffer.from('01', 'hex');
  const hash = calcHash(str, 'crc32');

  log(hash.toString('hex'));
};

main();