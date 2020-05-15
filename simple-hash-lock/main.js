'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const hash = require('../hash');

const main = () => {
  const args = process.argv.slice(2).join(' ').split(' ');

  if(args.length !== 2)
    O.err('Expected exactly 2 arguments');

  const [fin, fout] = args;

  const data = O.rfs(fin);
  const locked = Buffer.alloc(data.length);
  const csum = hash(fin, 'sha512');
  let aux = csum;

  for(let i = 0; i !== data.length; i++){
    const j = i & 63;

    locked[i] = data[i] ^ aux[j];

    if(j === 63)
      aux = hash(Buffer.concat([aux, data.slice(i - 63, i + 1)]), 'sha512');
  }

  O.wfs(fout, Buffer.concat([locked, csum]));
};

main();