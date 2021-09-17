'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

class TheoryInfo{
  constructor(name, type){
    this.name = name;
    this.type = type;
  }

  get isDir(){
    return this.type === 0;
  }

  get isFile(){
    return this.type === 1;
  }

  get title(){
    return thCtors[this.type].name2title(this.name);
  }
}

module.exports = TheoryInfo;

const Theory = require('./theory');

const {Dir, File} = Theory;

const thCtors = [
  Dir,
  File,
];