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
    return config.rootDir;
  }

  get root(){
    if(this.#root === null)
      this.#initRoot();

    return this.#root;
  }

  getThsInfo(pth){
    if(!fs.existsSync(pth))
      return [];

    const indexFile = path.join(pth, config.indexFile);

    if(!fs.existsSync(indexFile))
      return [];

    const indexInfo = O.rfs(indexFile, 1);

    return O.sanll(indexInfo).map(infoStr => {
      const infoLines = O.sanl(infoStr);
      let name = infoLines.shift();

      const isDir = name.endsWith('/');
      let fsName;

      if(isDir){
        name = name.slice(0, -1);
        fsName = name;
      }else{
        fsName = `${config.thPrefix}${name}${config.thExt}`;
      }

      const pthNew = path.join(pth, fsName);
      return new TheoryInfo(name, isDir, pthNew);
    });
  }

  exists(dir, name){
    const pthNew = path.join(dir.fsPath, name);
    return fs.existsSync(pthNew);
  }
}

module.exports = System;