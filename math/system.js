'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Theory = require('./theory');
const config = require('./config');
const util = require('./util');
const su = require('./str-util');

const {Dir, File} = Theory;
const {rootDir, thExt} = config;

class System{
  #root = null;
  rootDir = rootDir

  #initRoot(){
    const {rootDir} = this;
    const thsInfo = this.getThsInfo(rootDir);

    this.root = new Dir(this, null, '', thsInfo);
  }

  get root(){
    if(this.#root === null)
      this.#initRoot();

    return this.#root;
  }

  getThsInfo(pth){
    if(!fs.existsSync(pth))
      return [];

    return fs.readdirSync(pth).map(name => {
      const isFile = name.endsWith(`.${thExt}`);
      const isDir = !isFile;

      if(isFile)
        name = name.slice(0, -(thExt.length + 1));

      const pthNew = path.join(pth, name);
    });
  }
}

module.exports = System;