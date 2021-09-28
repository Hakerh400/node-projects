'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const O = require('../omikron');
const Editor = require('./editor');
const EventTarget = require('./event-target');
const config = require('./config');
const util = require('./util');
const su = require('./str-util');

const {ws, hs, ofs, tabW, tabH} = config;

class Theory extends EventTarget{
  static name2title(name){ O.virtual('name2title'); }
  static name2fs(name){ O.virtual('name2fs'); }

  static title2name(title){
    if(title.endsWith('/'))
      return title.slice(0, -1);

    return title;
  }

  constructor(system, parent, name, fsPath=null){
    super();

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

  render(g, ofs, x, y, w, h){ O.virtual('render'); }
  onKeyDown(evt){ O.virtual('onKeyDown'); }
  onKeyPress(evt){ O.virtual('onKeyPress'); }
}

class Dir extends Theory{
  static name2title(name){
    return `${name}/`;
  }

  static name2fs(name){
    return name;
  }

  constructor(system, parent, name, fsPath, thsInfo){
    super(system, parent, name, fsPath);

    this.thsInfo = thsInfo;
    this.dirs = O.obj();
    this.files = O.obj();

    const thsObj = O.obj();
    const lines = [`${this.pathStr}/`, ''];
    const editor = new Editor();

    if(thsInfo.length !== 0){
      for(const info of this.thsInfo){
        const {name, title} = info;
        assert(!O.has(thsObj, name));

        thsObj[name] = info;
        lines.push(title);
      }
    }else{
      lines.push('(empty)');
    }

    this.thsObj = thsObj;

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

  onKeyDown(tab, evt){
    const {ctrlKey, shiftKey, altKey, code} = evt;
    const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;
    const {system, editor} = this;

    const line = editor.curLine;
    const subName = Theory.title2name(line);

    if(flags === 0){
      if(code === 'ArrowUp'){
        this.goUp(1);
        return;
      }

      if(code === 'ArrowDown'){
        this.goDown(1);
        return;
      }

      if(code === 'Enter'){
        const th = system.getTh(this, subName);
        tab.setTheory(th);

        return;
      }

      return;
    }

    if(flags === 1){
      if(code === 'ArrowUp'){
        const {parent} = this;
        if(parent === null) return;
        tab.setTheory(parent);
        return;
      }

      return;
    }

    if(flags === 4){
      if(code.startsWith('Arrow')){
        editor.emit('onKeyDown', evt);
        return;
      }

      return;
    }

    // editor.onKeyDown(evt);
  }

  onKeyPress(tab, evt){
    const {editor} = this;

    // editor.emit('onKeyPress', evt);
  }

  render(g, ofs, x, y, w, h){
    const {editor} = this;

    const ofs2 = ofs * 2;
    const width = (w - ofs2) / ws | 0;
    const height = (h - ofs2) / hs | 0;

    g.translate(x + ofs, y + ofs);
    g.scale(ws, hs);
    editor.render(g, width, height);
    g.resetTransform();
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

  hasTh(name){
    return O.has(this.thsObj, name);
  }

  getThInfo(name){
    const {thsObj} = this;
    if(!O.has(thsObj, name)) return null;
    return thsObj[name];
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

  static name2fs(name){
    return `${config.thPrefix}${name}.${config.thExt}`;
  }

  constructor(system, parent, name, fsPath, text){
    super(system, parent, name, fsPath);

    const mainEditor = new Editor();
    const outputEditor = new Editor();

    mainEditor.setText(text);
    mainEditor.editable = 1;
    mainEditor.selected = 1;

    this.mainEditor = mainEditor;
    this.outputEditor = outputEditor;
  }

  get isFile(){ return 1; }

  render(g){
    const {mainEditor, outputEditor} = this;

    const iwRaw = O.iw;
    const ihRaw = O.ih;
    const iw = iwRaw;
    const ih = ihRaw - tabH;
    const iwh = iw / 2;
    const ihh = ih / 2;
    const ofsX = ofs;
    const ofsY = ofs + tabH;
    const ofs2 = ofs * 2;
    const width = (iw - ofs2) / ws >> 1;
    const height = (ih - ofs2) / hs | 0;

    g.beginPath();
    g.moveTo(iwh, tabH);
    g.lineTo(iwh, ihRaw);
    g.stroke();

    g.translate(ofsX, ofsY);
    g.scale(ws, hs);
    mainEditor.render(g, width, height);
    g.resetTransform();

    g.translate(iwh + ofs, ofs);
    g.scale(ws, hs);
    outputEditor.render(g, width, height);
    g.resetTransform();
  }

  onKeyDown(tab, evt){
    const {ctrlKey, shiftKey, altKey, code} = evt;
    const flags = (ctrlKey << 2) | (shiftKey << 1) | altKey;
    const {system, mainEditor} = this;

    const line = mainEditor.curLine;
    const subName = Theory.title2name(line);

    mainEditor.onKeyDown(evt);
  }

  onKeyPress(tab, evt){
    const {mainEditor} = this;

    mainEditor.emit('onKeyPress', evt);
  }
}

module.exports = Object.assign(Theory, {
  Dir,
  File,
});

const TheoryInfo = require('./theory-info');