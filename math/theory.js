'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

class Theory{
  saved = 0;

  constructor(parent, name){
    this.parent = parent;
    this.name = name;
  }

  get isDir(){ return 0; }
  get isFile(){ return 0; }

  render(g, x, y, ws, hs){ O.virtual('render'); }

  get hasParent(){
    return this.parent !== null;
  }

  get isRoot(){
    return !this.hasParent;
  }

  get title(){
    return this.name;
  }

  getPath(){
    const path = [];

    for(let t = this; t !== null; t = t.parent)
      path.push(t.name);

    return path.reverse();
  }
}

class Dir extends Theory{
  ths = O.obj();

  get isDir(){ return 1; }

  get title(){
    return `${this.name}/`;
  }

  render(g, x, y, ws, hs){
    
  }

  getThNames(){
    return O.sortAsc(O.keys(this.ths));
  }

  hasTh(name){
    return O.has(this.ths, name);
  }

  getThs(){
    return this.ths;
  }

  getTh(name){
    if(!this.hasTh(name)) return null;
    return this.ths[name];
  }

  addTh(th){
    const {name} = th;
    assert(!this.hasTh(name));
    this.ths[name] = th;
  }
}

class File extends Theory{
  get isFile(){ return 1; }
}

module.exports = Object.assign(Theory, {
  Dir,
  File,
});