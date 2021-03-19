'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const fsRec = require('../fs-rec');

const levelsDir = 'C:/Program Files/Enigma/data/levels';

const main = () => {
  const dir = new fsRec.Directory(levelsDir);

  dir.topDown(file => {
    if(!file.isFile) return;
    if(file.ext !== 'xml') return;

    const {pth} = file;
    let str = O.rfs(pth, 1);

    if(!/\<el\:level\b/.test(str))
      return;

    const replace = (...args) => {
      const strNew = str.replace(...args);

      if(strNew === str)
        O.error(pth);

      str = strNew;
    };

    replace(/\<el\:author\s+el\:name\=\"[^"]*\"/, a => {
      return a.replace(/\"[^"]*\"/, '"some user"');
    });

    replace(/\<el\:copyright\>[^\<]*/, a => {
      return a.replace(/\>[^\<]*/, '>');
    });

    O.wfs(pth, str);
  });
};

main();