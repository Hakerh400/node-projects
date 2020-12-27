'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const fsRec = require('../fs-rec');
const format = require('../format');

const IDS_FILE = format.path('-dw/ids.txt');
const VIDS_DIR = 'D:/Videos/Other/Folder/Channels/Other/T';
const BATCH_FILE = path.join(VIDS_DIR, 'a.bat');
const URL_BASE = 'https://www.youtube.com/watch?v=';

const main = () => {
  if(!fs.existsSync(BATCH_FILE))
    O.wfs(BATCH_FILE, '');

  const idsOld = O.obj();
  const idsNew = O.obj();

  const dir = new fsRec.Directory(VIDS_DIR);

  dir.topDown(a => {
    if(!a.isFile) return;

    let {name} = a;
    if(name.length < 11) return;

    name = name.replace(/[\~\[\]]+/g, '');

    idsOld[name.slice(name.length - 11)] = 1;
  });

  const idsArrs = [
    O.sanl(O.rfs(IDS_FILE, 1)),
    O.sanl(O.rfs(BATCH_FILE, 1)).slice(3).map(a => a.slice(a.length - 11)),
  ];

  for(const idsArr of idsArrs){
    for(const id of idsArr){
      if(!/^[a-zA-Z0-9\-_]{11}$/.test(id)) continue;

      if(id in idsOld){
        log(id);
        continue;
      }

      idsNew[id] = 1;
    }
  }

  O.wfs(BATCH_FILE, `@echo off\ncls\n\n${O.shuffle(O.keys(idsNew)).map(id => {
    return `call d ${URL_BASE}${id}`;
  }).join('\n')}`.trim());
};

main();