'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Memory = require('./memory');

const main = () => {
  const mem = new Memory();

  const a1 = mem.alloc(3);
  const a2 = mem.alloc(5);
  const a3 = mem.alloc(7);

  log();
  mem.free(a2);
  
  const a4 = mem.alloc(3);
  const a5 = mem.alloc(2);
  
  log();
  mem.free(a3);
  mem.free(a1);
  mem.free(a5);
  mem.free(a4);
};

main();