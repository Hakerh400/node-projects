'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../omikron');
const fsRec = require('../../fs-rec');
const format = require('../../format');

const idsFile = format.path('-dw/pl.txt');
const ids = O.sanl(O.rfs(idsFile, 1).trim()).map(a => a.trim());

const dir = new fsRec.Directory('D:/Music/Play');
const dir1 = new fsRec.Directory(dir.join('1'));

if(!dir1.exists)
  fs.mkdirSync(dir1.pth);

for(const file of dir)
  if(ids.some(a => file.name.includes(a)))
    file.move(file.join(`../1/${file.base}`));