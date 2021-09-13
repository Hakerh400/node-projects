'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Editor = require('./editor');
const util = require('./util');
const su = require('./str-util');

class Theory{
  saved = 0;

  constructor(parent, name){
    this.parent = parent;
    this.name = name;

    const path = [];

    for(let t = this; t !== null; t = t.parent)
      path.push(t.name);

    this.path = path.reverse();
    this.pathStr = `/${path.join('/')}`;
  }

  get isDir(){ return 0; }
  get isFile(){ return 0; }

  get hasParent(){
    return this.parent !== null;
  }

  get isRoot(){
    return !this.hasParent;
  }

  get title(){
    return this.name;
  }

  render(g, ofs, x, y, w, h, ws, hs){ O.virtual('render'); }
  onKeyDown(evt){ O.virtual('onKeyDown'); }
  onKeyPress(evt){ O.virtual('onKeyPress'); }
}

class Dir extends Theory{
  thsArr = [];
  thsObj = O.obj();

  constructor(parent, name){
    super(parent, name);

    const editor = new Editor();

    const lines = [
      this.pathStr, '',
      ...this.getThNames(),
    ];

    editor.setText(lines.join('\n'));
    editor.editable = 1;

    this.editor = editor;
  }

  get isDir(){ return 1; }

  get title(){
    return `${this.name}/`;
  }

  render(g, ofs, x, y, w, h, ws, hs){
    const {editor} = this;

    const ofs2 = ofs * 2;
    const width = (w - ofs2) / ws | 0;
    const height = (h - ofs2) / hs | 0;

    g.translate(x + ofs, y + ofs);
    g.scale(ws, hs);
    editor.render(g, width, height);
    g.resetTransform();
  }

  onKeyDown(evt){
    this.editor.onKeyDown(evt);
  }

  onKeyPress(evt){
    this.editor.onKeyPress(evt);
  }

  getThNames(){
    return this.ths.map(a => a.name);
  }

  hasTh(name){
    return O.has(this.thsObj, name);
  }

  getTh(name){
    if(!this.hasTh(name)) return null;
    return this.thsObj[name];
  }

  get ths(){
    return this.thsArr;
  }

  get thsNum(){
    return this.thsArr.length;
  }

  addTh(th, index=null){
    const {name} = th;
    assert(!this.hasTh(name));

    const {thsArr, thsObj, thsNum} = this;

    if(index === null)
      index = thsNum;

    this.thsObj[name] = th;
    this.thsArr.splice(index, 0, th);
  }
}

class File extends Theory{
  get isFile(){ return 1; }
}

module.exports = Object.assign(Theory, {
  Dir,
  File,
});