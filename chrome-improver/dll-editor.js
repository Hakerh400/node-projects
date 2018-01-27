'use strict';

var fs = require('fs');
var path = require('path');
var asyncFuncs = require('./async-funcs.js');
var chromeProcessKiller = require('./chrome-process-killer.js');
var debug = require('./debug.js');
var env = require('./environment.js');
var nop = require('./nop.js');

module.exports = {
  edit
};

function edit(block = true, cb = nop){
  var obj = {block};

  asyncFuncs.exec([
    (obj, cb) => chromeProcessKiller.kill(cb),
    findDllDir,
    loadBuffs,
    replaceBuff
  ], [obj], cb);
}

function findDllDir(obj, cb = nop){
  var sdrive = env.getSystemDrive();
  var dir1 = `${sdrive}:/Program Files/Google/Chrome/Application`;
  var dir2 = `${sdrive}:/Program Files (x86)/Google/Chrome/Application`;
  var dir = fs.existsSync(dir1) ? dir1 : dir2;

  fs.readdir(dir, (err, files) => {
    if(err) return cb(err);

    var versions = files.filter(file => {
      return /^\d+(?:\.\d+)*$/.test(file);
    });

    var version = versions.reduce((version1, version2) => {
      var v1 = version1.split`.`.map(num => num | 0);
      var v2 = version2.split`.`.map(num => num | 0);

      while(v1[0] == v2[0]){
        v1.shift();
        v2.shift();
      }

      return v1[0] > v2[0] ? version1 : version2;
    });

    obj.dllFile = path.join(dir, version, 'chrome.dll');
    cb();
  });
}

function loadBuffs(obj, cb = nop){
  var dllEditorDir = 'dll-editor';
  var buffsModule = path.join(dllEditorDir, 'buffers.js');
  var buffsModulePath = `./${buffsModule}`;
  var buffs = require(buffsModulePath);

  var buff1 = buffs.getBuffer(0);
  var buff2 = buffs.getBuffer(1);

  if(!obj.block){
    buff2.forEach((byte, index) => {
      [buff1[index], buff2[index]] = [byte, buff1[index]];
    });
  }

  obj.buffs = [buff1, buff2];

  cb();
}

function replaceBuff(obj, cb = nop){
  fs.readFile(obj.dllFile, (err, dll) => {
    if(err) return cb(err);

    var index1 = dll.indexOf(obj.buffs[0]);
    var index2 = dll.lastIndexOf(obj.buffs[0]);

    if(index1 == -1){
      obj.buffs[1].forEach((byte, index) => {
        obj.buffs[0][index] = byte;
      });

      var index = dll.indexOf(obj.buffs[0]);

      if(index == -1){
        return cb('Cannot find the target machine code pattern in "chrome.dll".');
      }else{
        logIndex(index);
        debug.log(`Feature "messages" is already ${obj.block ? 'blocked' : 'unblocked'}.`);

        return cb('');
      }
    }

    if(index1 !== index2){
      return cb('Found multiple search results in "chrome.dll".');
    }

    logIndex(index1);

    obj.buffs[1].forEach((byte, index) => {
      dll[index1 + index] = byte;
    });

    fs.writeFile(obj.dllFile, dll, err => {
      if(err) return cb(err);
      cb();
    });
  });
}

function logIndex(index){
  debug.log(`Found code pattern at index ${intToHex(index)}.`);
}

function intToHex(int){
  return int.toString(16).toUpperCase().padStart(8, '0');
}