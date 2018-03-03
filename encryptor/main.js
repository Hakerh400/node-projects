'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var encryptor = require('.');

var decryptedDir = 'decrypted';
var encryptedDir = 'encrypted';

var mode = 'd';
var password = O.password;

setTimeout(main);

function main(){
  var cwd = process.cwd();

  decryptedDir = path.join(cwd, decryptedDir);
  encryptedDir = path.join(cwd, encryptedDir);

  initDirs();
  resetDir(mode);

  if(mode == 'e'){
    encryptor.encrypt(decryptedDir, encryptedDir, password, a => console.log(a || 'Finished'));
  }else{
    encryptor.decrypt(encryptedDir, decryptedDir, password, a => console.log(a || 'Finished'));
  }
}

function initDirs(){
  if(!fs.existsSync(encryptedDir)) fs.mkdirSync(encryptedDir);
  if(!fs.existsSync(decryptedDir)) fs.mkdirSync(decryptedDir);
}

function resetDir(mode){
  var dir = mode == 'e' ? encryptedDir : decryptedDir;

  fsRec.deleteFilesSync(dir);
  fs.mkdirSync(dir);
}