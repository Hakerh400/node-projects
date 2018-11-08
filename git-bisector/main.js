'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const fsRec = require('../fs-recursive');
const encryptor = require('../encryptor');
const media = require('../media');
const tempDir = require('../temp-dir')(__filename);
const bisector = require('.');

const repo = 'Hakerh400/node-projects';

var index = 0;
var num = null;

setTimeout(main);

function main(){
  log('Initializing');

  bisector.bisect(repo, firstCommit, nextCommit, checkFunc, (err, commit) => {
    if(err) return log(err);
    if(commit === null) return log('Not found.');

    log(commit);
  });
}

function firstCommit(n){
  num = n;
  return n - 1;
}

function nextCommit(i, n){
  return i - 1;
}

function checkFunc(dir, cb){
  media.logStatus(++index, num, 'commit');

  resetTempDir();

  var found = 0;

  fsRec.processFilesSync(dir, d => {
    if(found || d.processed) return;

    var p = d.fullPath;

    if(p.includes('obfuscator') && p.endsWith('.txt')){
      var str = fs.readFileSync(p, 'utf8');
      if(str.includes('swap'))
        found = 1;
    }
  });

  cb(found);
}

function resetTempDir(){
  if(fs.existsSync(tempDir))
    fsRec.deleteFilesSync(tempDir);

  fs.mkdirSync(tempDir);
}