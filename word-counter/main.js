'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const http = require('http');
const https = require('https');
const net = require('net');
const urlm = require('url');
const stream = require('stream')
const cp = require('child_process');
const EventEmitter = require('events');
const readline = require('readline');
const crypto = require('crypto');
const O = require('../omikron');
const media = require('../media');
const ImageData = require('../image-data');
const fsRec = require('../fs-rec');
const format = require('../format');
const Table = require('../table');

const ws = [
  'the','and', 'for', 'how', 'what', 'not',
];

const strs = O.obj();

fsRec.processFilesSync('D:/Videos/Other/Folder/Channels', d => {
  if(d.processed) return;
  if(d.isDir) return;

  log(d.relativeSubPath);

  const {name} = path.parse(d.name);

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