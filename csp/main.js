'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const CSP = require('./csp');

O.bion();

// O.enhanceRNG();
// O.randSeed(0);

const cwd = __dirname;
const formulaFile = path.join(cwd, 'formula.js');

const main = async () => {
  const formula = O.rfs(formulaFile, 1);
  const result = await CSP.solve(formula);

  O.logb();

  if(result === null){
    log('unsat');
    return;
  }

  const w = 5;
  const h = 5;
  let str = '';

  for(let y = 0; y !== h; y++){
    if(y !== 0) str += '\n';

    for(let x = 0; x !== w; x++)
      str += result[y * w + x] ? '#' : '.';
  }

  log(str);

  // for(const key of O.sortAsc(O.keys(result))){
  //   const val = result[key];
  //   log(`${key}: ${val}`);
  // }
};

main().catch(log);