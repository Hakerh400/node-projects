'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format= require('../format');
const dna = require('.');

const main = () => {
  const str = dna.gen();
  O.wfs(format.path('-dw/1.txt'), str);
};

main();