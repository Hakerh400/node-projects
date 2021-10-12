'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');

const defaultFile = format.path('-dw/1.txt');

const main = () => {
  const args = process.argv.slice(2);
  
  if(args.length === 0)
    args.push(defaultFile);
  
  const pth = args.join(' ');
  const str = O.rfs(pth, 1);
  
  O.wfs(pth, O.sortAsc(O.undupe(O.sanl(str))).join('\n'));
};

main();