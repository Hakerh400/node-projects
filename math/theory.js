'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Theory{
  exists = 0;

  constructor(parent, name){
    this.parent = parent;
    this.name = name;
  }

  get isDir(){ return 0; }
  get isFile(){ return 0; }

  hasParent(){
    return this.parent !== null;
  }

  getPath(){
    const path = [];

    for(let t = this; t !== null; t = t.parent)
      path.push(t.name);

    return path.reverse();
  }
}

class Dir extends Theory{
  files = new Set();

  get isDir(){ return 1; }

  getFileNames(){
    return O.sortAsc([...this.files].map(a => a.name));
  }
}

class File extends Theory{
  get isFile(){ return 1; }
}

module.exports = Theory;