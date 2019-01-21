'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const hash = require('../hash');

const key = process.argv[2];
const inFile = process.argv[3];
const outFile = process.argv[4];

setTimeout(main);

function main(){
  const input = fs.readFileSync(inFile);
  const output = encrypt(input, key);
  fs.writeFileSync(outFile, output);
}

function encrypt(data, key){
  key = Buffer.from(key);
  
  const d = Buffer.from(data);
  let b = hash(key);

  for(let i = 0, j = 0; i !== d.length; i++, j++){
    d[i] ^= b[j];

    if(j === b.length){
      b = hash(Buffer.concat([b, key]));
      j = 0;
    }
  }

  return d;
}