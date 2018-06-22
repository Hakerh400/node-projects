'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var encryptor = require('../encryptor');
var tempDir = require('../temp-dir')(__filename);
var bisector = require('.');

var repo = 'Hakerh400/node-projects';

var password = O.password;

setTimeout(main);

function main(){
  bisector.bisect(repo, firstCommit, nextCommit, checkFunc, (err, commit) => {
    if(err)
      return console.log(err);

    if(commit === null)
      return console.log('Not found.');

    console.log(commit);
  });
}

function firstCommit(n){
  return n - 1;
}

function nextCommit(i, n){
  return i - 1;
}

function checkFunc(dir, cb){
  resetTempDir();

  var found = false;

  fsRec.processFilesSync(dir, d => {
    if(found || d.processed)
      return;

    if(d.name === 'background')
      found = true;
  });

  cb(found);
}

function resetTempDir(){
  if(fs.existsSync(tempDir))
    fsRec.deleteFilesSync(tempDir);

  fs.mkdirSync(tempDir);
}