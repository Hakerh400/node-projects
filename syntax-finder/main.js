'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const finder = require('./finder');

const args = process.argv.slice(2);
const cwd = __dirname;

const dirs = [
  O.dirs.web,
  path.join(cwd, '..'),
  path.join(cwd, '../../Omikron'),
  path.join(cwd, '../../Esolangs'),
  path.join(cwd, '../../../Extensions/Ultra Block'),
];

const codeExts = [
  'bat',
  'js',
  'php',
  'sql',
  'c',
  'cc',
  'cpp',
  'h',
  'hh',
];

const textExts = codeExts.concat([
  'txt',
  'md',
  'json',
  'htm',
  'css',
  'xml',
  'yml',
]);

if(args.length === 0)
  O.exit('ERROR: Expected a string as argument');

const strToFind = args.join(' ').toLowerCase();

const main = () => {
  const output = finder.find(dirs, textExts, func);

  if(output.length !== 0)
    log(output.join('\n'));
};

const func = (file, src) => {
  const lines = O.sanl(src);

  const index = lines.findIndex(line => {
    return line.toLowerCase().includes(strToFind);
  });

  return index + 1;
};

main();