'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');

const cwd = __dirname;
const inputFile = path.join(cwd, 'esolangs-list.txt');
const outputFile = format.path('-dw/3.txt');

const main = () => {
  O.wfs(outputFile, (a => {
    return `|Language|Status|Reason|\n| :--- | :---: | :---: |\n${O.sortAsc(O.undupe(O.sanl(a.trim()).map(a => a.trim()).filter(a => a))).map(a => {
      return `|[${a.split('').map(a => `&#x${O.cc(a).toString(16).toUpperCase()};`).join('')}](https://esolangs.org/wiki/${
        Array.from(Buffer.from(a)).map(a => `%${O.hex(a, 1)}`).join('')})|Unsupported|Unknown|`;
    }).join('\n')}`;
  })(O.rfs(inputFile, 1)));
};

main();