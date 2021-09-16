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
const {rootDir} = config;

class System{
  #root = null;
  rootDir = rootDir

  initRoot(){
    this.root = this.constructDir(null, rootDir);
  }

  get root(){
    if(this.#root === null)
      this.initRoot();

    return this.#root;
  }

  constructDir(parent, pth){
    const name = parent !== null ?
      path.parse(pth).name : '';

    return new Dir(parent, name);
  }
}

module.exports = System;