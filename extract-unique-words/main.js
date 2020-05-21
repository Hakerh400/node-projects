'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');

const fin = format.path('-dw/1.txt');
const fout = format.path('-dw/2.txt');

const main = () => {
  O.wfs(fout, (a => {
    return O.undupe(O.match(a.toLowerCase(), /[a-z]+/g)).join(' ');
  })(O.rfs(fin, 1)));
};

main();