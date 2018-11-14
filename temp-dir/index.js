'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

module.exports = getTempDir;

function getTempDir(scriptPath){
  var project = scriptPath.split(/[\/\\]/).slice(-2)[0];
  var tempDir;

  do{
    var dirName = generateDirName(project);
    tempDir = path.join(O.dirs.temp, dirName);
  }while(fs.existsSync(tempDir));

  fs.mkdirSync(tempDir);

  return tempDir;
}

function generateDirName(project){
  var randStr = generateRandStr();
  return `${project}_${randStr}`;
}

function generateRandStr(){
  return `${O.rand(1 << 30)}`;
}