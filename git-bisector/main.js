'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsRec = require('../fs-rec');
const media = require('../media');
const tempDir = require('../temp-dir')(__filename);
const bisector = require('.');

const REVERSED = 1;

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
  return REVERSED ? n - 1 : 0;
}

function nextCommit(i, n){
  return REVERSED ? i - 1 : i + 1;
}

function checkFunc(ci, dir, cb){
  media.logStatus(++index, num, `commit [${ci}]`);

  resetTempDir();

  var found = 0;

  fsRec.processFilesSync(dir, d => {
    if(found || d.processed) return;

    var p = d.fullPath;

    if(p.includes('ray-tracer'))
      found = 1;
  });

  cb(found);
}

function resetTempDir(){
  if(fs.existsSync(tempDir))
    fsRec.deleteFilesSync(tempDir);

  fs.mkdirSync(tempDir);
}