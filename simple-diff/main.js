'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const hash = require('../hash');

const main = () => {
  const args = process.argv.slice(2);

  const err = () => {
    O.err('Expected two files as arguments');
  };

  if(args.length === 0) err();

  const argsJoined = args.join(' ');
  const files = argsJoined.match(/[^"\s]\S*|"[^"]*"/g).map(a => a.replace(/"/g, ''));
  if(files.length !== 2) err();

  const lines1 = O.sanl(O.rfs(files[0], 1));
  const lines2 = O.sanl(O.rfs(files[1], 1));

  const index = lines1.findIndex((a, b) => {
    return lines2[b] !== a;
  });

  if(index === -1){
    log('All lines are same.');
    return;
  }

  log(index + 1);
};

main();