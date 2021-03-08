'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Database = require('./database');

const {
  SYM,
  FST,
  SND,
  REDUCED_TO,
  REDUCED_FROM,
  REF_FST,
  REF_SND,
  REF_BOTH,
  BASE_SYM,
  DEPTH,

  isSym,
  isPair,
  infoSym,
  infoPair,
} = Database;

const cwd = __dirname;
const testDir = path.join(cwd, 'test');

const main = () => {
  
};

main();