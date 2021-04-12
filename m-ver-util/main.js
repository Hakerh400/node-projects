'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const strs = require('../strs');

const VERSION = '21w14a';

const mainDir = `C:/Users/Thomas/AppData/Roaming/.${strs.m}`;
const versDir = path.join(mainDir, 'versions');
const verDir = path.join(versDir, VERSION);
const jarFile = path.join(verDir, `${VERSION}.jar`);
const bakFile = path.join(verDir, `${VERSION}.jar.bak`);

const main = () => {
  if(!fs.existsSync(bakFile)){
    log('Creating backup file');
    O.wfs(bakFile, O.rfs(jarFile));
  }

  log(strs)

  log('Done');
};

main();