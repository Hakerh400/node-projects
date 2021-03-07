'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const rmi = require('..');

const dir = path.join(rmi.mainDir, 'tags');

if(!fs.existsSync(dir))
  fs.mkdirSync(dir);

module.exports = dir;