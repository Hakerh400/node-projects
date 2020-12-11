'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const xxd = require('../xxd');

const main = () => {
  const args = process.argv.slice(2);

  const err = () => {
    O.err('Expected a file as argument');
  };

  if(args.length === 0) err();

  const argsJoined = args.join(' ');
  const file = argsJoined;
  const buf = O.rfs(file);

  log(xxd.buf2hex(buf));
};

main();