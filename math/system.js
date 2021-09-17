'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Theory = require('./theory');
const TheoryInfo = require('./theory-info');
const config = require('./config');
const util = require('./util');
const su = require('./str-util');

const {Dir, File} = Theory;
const {rootDir, thExt} = config;

class System{
  #root = null;

  #constructDir(parent, name, fsPath){
    const thsInfo = this.getThsInfo(fsPath);
    return new Dir(this, parent, name, fsPath, thsInfo);
  }

  #initRoot(){
    const {rootDir} = this;
    this.#root = this.#constructDir(null, '', rootDir);
  }

  get rootDir(){
    return rootDir;
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

      const pthNew = path.join(pth, name);

      if(isDir)
        return new TheoryInfo(name, 0);

      const nameNew = name.slice(0, -(thExt.length + 1));
      return new TheoryInfo(nameNew, 1);
    });
  }
}

module.exports = System;