'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');

module.exports = {
  find,
};

function find(dirs, exts, func){
  var arr = [];

  dirs.forEach(dir => {
    fsRec.processFilesSync(dir, d => {
      if(d.isDir || d.fullPath.includes('node_modules'))
        return;

      var ext = path.parse(d.name).ext.substring(1);
      if(!exts.includes(ext)) return;

      var src = fs.readFileSync(d.fullPath, 'utf8');
      var line = func(d.fullPath, src);
      if(!line) return;

      arr.push(new Element(d.fullPath, line));
    });
  });

  return arr;
}

class Element{
  constructor(filePath, line){
    this.filePath = filePath;
    this.line = line;
  }

  toString(){
    return `${this.filePath}:${this.line}`;
  }
};