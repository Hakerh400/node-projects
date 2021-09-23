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

  #constructFile(parent, name, fsPath){
    const text = O.rfs(fsPath);
    return new Dir(this, parent, name, fsPath, text);
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

    return O.sanll(indexInfo, 0).map(infoStr => {
      const infoLines = O.sanl(infoStr);
      const nameRaw = infoLines.shift();

      const isDir = nameRaw.endsWith('/');
      const name = isDir ? nameRaw.slice(0, -1) : nameRaw;

      return new TheoryInfo(name, isDir);
    });
  }

  getTh(dir, name){
    const thInfo = dir.getThInfo(name);
    if(thInfo === null) return null;

    const {fsName, isDir} = thInfo;
    const pthNew = path.join(dir.fsPath, fsName);

    if(isDir)
      return this.#constructDir(dir, name, pthNew);

    return this.#constructFile(dir, name, pthNew);
  }

  exists(dir, name){
    const pthNew = path.join(dir.fsPath, name);
    return fs.existsSync(pthNew);
  }
}

module.exports = System;