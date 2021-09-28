'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const O = require('../omikron');
const Theory = require('./theory');
const TheoryInfo = require('./theory-info');
const config = require('./config');
const util = require('./util');
const su = require('./str-util');

const {Dir, File} = Theory;

class System{
  #root = null;

  #getDir(parent, name, fsPath){
    const dirs = parent !== null ?
      parent.dirs : null;

    if(dirs !== null && O.has(dirs, name))
      return dirs[name];

    const thsInfo = this.getThsInfo(fsPath);
    const dir = new Dir(this, parent, name, fsPath, thsInfo);

    if(dirs !== null)
      dirs[name] = dir;

    return dir;
  }

  #getFile(parent, name, fsPath){
    const {files} = parent;

    if(O.has(files, name))
      return files[name];

    const text = O.rfs(fsPath, 1);
    const file = new File(this, parent, name, fsPath, text);

    files[name] = file;

    return file;
  }

  #initRoot(){
    const {rootDir} = this;
    this.#root = this.#getDir(null, '', rootDir);
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
      return this.#getDir(dir, name, pthNew);

    return this.#getFile(dir, name, pthNew);
  }

  exists(dir, name){
    const pthNew = path.join(dir.fsPath, name);
    return fs.existsSync(pthNew);
  }
}

module.exports = System;