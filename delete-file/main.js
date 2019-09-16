'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const args = process.argv.slice(2);

const main = () => {
  fs.unlinkSync(args[0]);
};

main();