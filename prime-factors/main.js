'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Table = require('../table');
const primeFactors = require('.');

const args = process.argv.slice(2);

const main = () => {
  if(args.length === 0)
    O.error('Expected integer as argument');

  const numStr = args.join(' ');
  if(!/^[1-9][0-9]*$/.test(numStr))
    O.error(`${O.sf(numStr)} is not a valid non-negative integer`);

  const num = BigInt(numStr);
  const factors = primeFactors.get(num);

  const table = new Table(['Factor', 'Repetitions']);

  if(factors.length !== 0){
    let factor = factors[0];
    let rep = 1;

    for(let i = 1; i !== factors.length; i++){
      const fac = factors[i];

      if(fac === factor){
        rep++;
        continue;
      }

      table.addRow([factor, rep]);

      factor = fac;
      rep = 1;
    }

    table.addRow([factor, rep]);
  }

  log(table.toString());
};

main();