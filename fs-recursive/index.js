'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');

module.exports = {
  processFiles,
  processFilesSync,
  deleteFiles,
  deleteFilesSync
};

function processFiles(filePath, func, cb = O.nop){
  processElem(false, [new FileQueueElem(formatPath(filePath))], func, cb);
}

function processFilesSync(filePath, func){
  processElem(true, [new FileQueueElem(formatPath(filePath))], func);
}

function processElem(sync, queue, func, cb = O.nop){
  while(1){
    var elem = queue.pop();

    func(FileQueueElem.copy(elem));

    if(elem.isDir && !elem.processed){
      elem.processed = true;
      queue.push(elem);

      var files = fs.readdirSync(elem.fullPath);

      files.forEach(file => {
        var fullPath = path.join(elem.fullPath, file);
        var relativePath = path.join(elem.relativePath, file);

        queue.push(new FileQueueElem(fullPath, relativePath));
      });
    }

    if(queue.length){
      if(sync) continue;
      else return setTimeout(() => processElem(false, queue, func, cb));
    }else{
      if(sync) return cb();
      else return setTimeout(() => cb());
    }
  }
}

function deleteFiles(filePath, cb = O.nop){
  processFiles(filePath, deleteFile, cb);
}

function deleteFilesSync(filePath){
  processFilesSync(filePath, deleteFile);
}

function deleteFile(obj){
  if(obj.isDir){
    if(obj.processed) fs.rmdirSync(obj.fullPath);
  }else{
    fs.unlinkSync(obj.fullPath);
  }
}

class FileQueueElem{
  constructor(fullPath, relativePath = null, depth = null, name = null, isDir = null, processed = false){
    if(isDir === null) isDir = fs.statSync(fullPath).isDirectory();
    if(name === null) name = path.parse(fullPath).base;
    if(relativePath === null) relativePath = name;
    if(depth === null) depth = (relativePath.match(/[\/\\]/g) || []).length;

    this.fullPath = fullPath;
    this.relativePath = relativePath;
    this.depth = depth;
    this.name = name;
    this.isDir = isDir;
    this.processed = processed;
  }

  static copy(elem){
    var {fullPath, relativePath, depth, name, isDir, processed} = elem;
    return new FileQueueElem(fullPath, relativePath, depth, name, isDir, processed);
  }
};

function formatPath(filePath){
  return filePath.replace(/\//g, '\\');
}