'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Editor = require('./editor');
const util = require('./util');
const su = require('./str-util');

class Theory{
  static name2title(name){ O.virtual('name2title'); }

  constructor(system, parent, name, fsPath=null){
    this.system = system;
    this.parent = parent;
    this.name = name;
    this.fsPath = fsPath;
  }

  get isDir(){ return 0; }
  get isFile(){ return 0; }

  get ctor(){
    return this.constructor;
  }

  get title(){
    return this.ctor.name2title(this.name);
  }

  get path(){
    const pth = [];

    for(let th = this; th !== null; th = th.parent)
      pth.push(th.name);

    return pth.reverse();
  }

  get pathStr(){
    return this.path.join('/');
  }

  render(g, ofs, x, y, w, h, ws, hs){ O.virtual('render'); }
  onKeyDown(evt){ O.virtual('onKeyDown'); }
  onKeyPress(evt){ O.virtual('onKeyPress'); }
}

class Dir extends Theory{
  static name2title(name){
    return `${name}/`;
  }

  thsObj = O.obj();

  constructor(system, parent, name, fsPath, thsInfo){
    super(system, parent, name, fsPath);

    this.thsInfo = thsInfo;

    const editor = new Editor();
    const lines = [`${this.pathStr}/`, ''];

    if(thsInfo.length !== 0){
      for(const info of this.thsInfo)
        lines.push(info.title);
    }else{
      lines.push('(empty)');
    }

    editor.setLines(lines);
    editor.editable = 1;
    editor.selected = 1;

    const offset = this.editorEntriesOffset;
    editor.cy = offset;


    this.editor = editor;
  }

  get isDir(){ return 1; }

  get editorEntriesOffset(){
    return 2;
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
    const {ctrlKey, shiftKey, altKey, code} = evt;
    const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;
    const {editor} = this;

    if(flags === 0){
      if(code === 'ArrowUp' || code === 'ArrowLeft'){
        this.goUp(1);
        return;
      }

      if(code === 'ArrowDown' || code === 'ArrowRight'){
        this.goDown(1);
        return;
      }

      return;
    }

    if(flags === 4){
      if(code.startsWith('Arrow')){
        editor.onKeyDown(evt);
        return;
      }

      return;
    }

    // this.editor.onKeyDown(evt);
  }

  onKeyPress(evt){
    // this.editor.onKeyPress(evt);
  }

  goVert(dy, wrap=0){
    const {editor} = this;
    const offset = this.editorEntriesOffset;
    const {lines} = editor;
    const linesNum = lines.length - offset;

    let cy = editor.cy - offset + dy;

    if(cy < 0 || cy >= linesNum){
      if(!wrap) return;
      cy = (cy % linesNum + linesNum) % linesNum;
    }

    editor.cy = cy + offset;
  }

  goUp(wrap){
    this.goVert(-1, wrap);
  }

  goDown(wrap){
    this.goVert(1, wrap);
  }

  // getThNames(){
  //   return this.ths.map(a => a.name);
  // }
  //
  // hasTh(name){
  //   return O.has(this.thsObj, name);
  // }
  //
  // getTh(name){
  //   if(!this.hasTh(name)) return null;
  //   return this.thsObj[name];
  // }
  //
  // get ths(){
  //   return this.thsArr;
  // }
  //
  // get thsNum(){
  //   return this.thsArr.length;
  // }
  //
  // addTh(th, index=null){
  //   const {name} = th;
  //   assert(!this.hasTh(name));
  //
  //   const {thsArr, thsObj, thsNum} = this;
  //
  //   if(index === null)
  //     index = thsNum;
  //
  //   this.thsObj[name] = th;
  //   this.thsArr.splice(index, 0, th);
  // }
}

class File extends Theory{
  static name2title(name){
    return name;
  }

  get isFile(){ return 1; }
}

module.exports = Object.assign(Theory, {
  Dir,
  File,
});

const TheoryInfo = require('./theory-info');