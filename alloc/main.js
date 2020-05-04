'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Memory = require('./memory');

const main = () => {
  const mem = new Memory();

  mem.log();

  const a1 = mem.alloc(3);
  mem.log();

  const a2 = mem.alloc(5);
  mem.log();

  const a3 = mem.alloc(7);
  mem.log();
  log();

  mem.free(a3);
  mem.log();

  mem.free(a1);
  mem.log();

  mem.free(a2);
  mem.log();
};

main();