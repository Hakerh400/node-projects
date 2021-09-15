'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Theory = require('./theory');
const util = require('./util');
const su = require('./str-util');

const {Dir, File} = Theory;

const cwd = __dirname;
const rootDir = path.join(cwd, 'logic');

class System{
  constructor(){
    this.root = new Dir(null, '');
  }

  getRoot(){
    return this.root;
  }
}

module.exports = System;