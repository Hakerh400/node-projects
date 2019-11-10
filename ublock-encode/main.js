'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const encode = require('.');

const main = () => {
  const args = process.argv.slice(2);

  if(args.length === 0)
    throw new TypeError('Expected string as argument');

  const str = args.join(' ');

  log(encode(str));
};

main();