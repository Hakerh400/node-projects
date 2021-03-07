'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const ublock = require('./ublock');
const tags = require('./tags');

const methods = {
  ublock,
  tags,

  async ping(){
    return 'ok';
  },

  async echo(val){
    return val;
  },

  fs: {
    async isFile(pth){
      return fs.statSync(pth).isFile();
    },

    async isDir(pth){
      return fs.statSync(pth).isDirectory();
    },
  },
};

module.exports = methods;