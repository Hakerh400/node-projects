'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsRec = require('../fs-recursive');

setTimeout(main);

function main(){
  clearTempDir();
}

function clearTempDir(){
  var tempDir = path.normalize(O.dirs.temp);

  fsRec.processFilesSync(tempDir, d => {
    if(d.processed){
      if(d.fullPath == tempDir) return;
      deleteDir(d.fullPath);
    }else if(!d.isDir){
      deleteFile(d.fullPath);
    }
  });
}

function deleteFile(file){
  try{
    fs.unlinkSync(file);
  }catch(e){}
}

function deleteDir(dir){
  try{
    fs.rmdirSync(dir);
  }catch(e){}
}