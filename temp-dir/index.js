'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');

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