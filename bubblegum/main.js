'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const bubblegum = require('.');

const MODE = 'enc';

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const fdec = path.join(testDir, 'decoded.txt');
const fenc = path.join(testDir, 'encoded.txt');

const main = () => {
  if(MODE === 'enc'){
    const input = O.lf(O.rfs(fdec, 1));
    const output = bubblegum.encode(input);
    O.wfs(fenc, output);
    return;
  }

  if(MODE === 'DEC'){
    const input = O.rfs(fenc);
    const output = bubblegum.decode(input);
    O.wfs(fdec, output);
    return;
  }
  
  assert.fail(MODE);
};

main();