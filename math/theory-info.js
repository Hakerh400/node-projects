'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

class TheoryInfo{
  constructor(name, isDir, path){
    this.name = name;
    this.isDir = isDir;
    this.path = path;
  }

  get isFile(){
    return !this.isDir;
  }

  get title(){
    const i = this.isDir ? 1 : 0;
    return thCtors[i].name2title(this.name);
  }
}

module.exports = TheoryInfo;

const Theory = require('./theory');

const {Dir, File} = Theory;

const thCtors = [
  File,
  Dir,
];