'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const hash = require('../hash');

const main = () => {
  const args = process.argv.slice(2);

  if(args.length === 0)
    O.err('Expected file as argument');

  const argsJoined = args.join(' ');
  const arg = argsJoined[0] === '"' ? argsJoined.slice(1, argsJoined.length - 1) : argsJoined;
  const data = O.rfs(arg);
  
  log(hash(data, 'sha256', 'hex'));
};

main();