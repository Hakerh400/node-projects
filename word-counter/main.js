'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsRec = require('../fs-rec');
const format = require('../format');
const Table = require('../table');

const MUSIC = 0;

const dir = process.argv.slice(2).join(' ').replace(/"/g, '');

const ws = [
  'the', 'and', 'for', 'how', 'what', 'not',
];

const strs = O.obj();

fsRec.processFilesSync(dir, d => {
  if(d.processed) return;
  if(d.isDir) return;

  log(d.relativeSubPath);

  const name = processName(path.parse(d.name).name);

  for(let str of name.match(/[a-z]+/gi) || []){
    str = str.toLowerCase();
    if(str in strs) strs[str]++;
    else strs[str] = 1;
  }
});

const table = new Table(['String', 'Count']);

const rows = O.keys(strs)
  .map(str => [str, strs[str]])
  .filter(([s, n]) => {
    if(n === 1) return 0;
    if(s.length <= 2) return 0;
    if(ws.includes(s)) return 0;
    return 1;
  }).sort(([s1, n1], [s2, n2]) => {
    if(n1 > n2) return -1;
    if(n1 < n2) return 1;
    if(s1 < s2) return -1;
    return 1;
  });

for(const row of rows)
  table.addRow(row);

O.wfs(format.path('-dw/1.txt'), table.toString());

function processName(str){
  if(MUSIC){
    const i = str.indexOf(']');
    if(i !== -1) str = str.slice(i);
  }
  
  return str;
}