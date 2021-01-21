'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const System = require('./system');

const main = () => {
  const system = new System([
    () => 0,
    a => a + 1,
    a => a - 1,
  ]);

  const [ZERO, INC, DEC] = O.ca(3, i => i);

  log(system.execProof([
    /* 0 */ [ZERO, [], 0],
    /* 1 */ [INC, [0], 1],
    /* 2 */ [INC, [1], 2],
    /* 3 */ [INC, [0], 1],
    /* 4 */ [INC, [2], 3],
    /* 5 */ [DEC, [4], 2],
  ]).join('\n'));
};

main();