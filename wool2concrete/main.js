'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const fsRec = require('../fs-rec');

const texturesDir = 'C:/Users/Thomas/AppData/Roaming/.minecraft/versions/21w11a/textures';

const main = () => {
  const dir = new fsRec.Directory(texturesDir);

  dir.topDown(file => {
    if(!file.isFile) return;
    if(file.ext !== 'png') return;

    const woolReg = /(?<![a-z])wool(?!=[a-z])/;

    if(!woolReg.test(file.name))
      return;

    const baseNew = file.base.replace(woolReg, 'concrete');
    const fileConcrete = file.join('..', baseNew);

    assert(fs.existsSync(fileConcrete));

    new fsRec.File(fileConcrete).copy(file.pth);
  });
};

main();