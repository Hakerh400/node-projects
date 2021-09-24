'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

const ext = 'txt';
const indexExt = ext;
const thExt = ext;
const indexFileName = 'index'
const rootDirName = 'logic';
const thPrefix = 'th-';
const ws = 12;
const hs = 25;
const ofs = 15;
const tabW = ws * 20;
const tabH = hs;

const cwd = __dirname;
const rootDir = path.join(cwd, 'logic');
const indexFile = `${indexFileName}.${indexExt}`;

const config = {
  ext,
  indexExt,
  thExt,
  indexFile,
  rootDir,
  thPrefix,
  ws,
  hs,
  ofs,
  tabW,
  tabH,
};

module.exports = config;