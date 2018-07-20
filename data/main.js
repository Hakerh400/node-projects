'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const fsRec = require('../fs-recursive');
const Encryptor = require('./encryptor.js');

const MAX_LINE_LEN = 128;
const LINE_REGEX = new RegExp(`.{${MAX_LINE_LEN}}|.+`, 'g');

const password = O.passwords.data;

const decryptedDir = path.join(O.dirs.projects, 'Data');
const encryptedDir = path.join(O.dirs.wamp, 'projects/test/data');

const encryptor = new Encryptor(password);

setTimeout(main);

function main(){
  refreshEncryptedDir();

  fsRec.processFilesSync(decryptedDir, d => {
    if(d.processed) return;
    if(d.fullPath === decryptedDir) return;

    var name = encryptName(d.name);
    var dir = encryptPath(path.join(d.relativePath, '..'));
    var outputPath = path.join(encryptedDir, dir, name);

    if(d.isDir){
      fs.mkdirSync(outputPath);
    }else{
      var data = encryptFile(d.fullPath);
      fs.writeFileSync(outputPath, data);
    }
  });
}

function refreshEncryptedDir(){
  if(fs.existsSync(encryptedDir))
    fsRec.deleteFilesSync(encryptedDir);

  fsRec.createDirSync(encryptedDir);
}

function encryptName(fileName){
  var {name, ext} = path.parse(fileName);

  name = encrypt(name);

  return `${name}${ext}`;
}

function encryptPath(path){
  var parts = path.split(/[\/\\]/).map(dir => {
    return encrypt(dir);
  });

  parts.shift();

  return parts.join('/');
}

function encryptFile(filePath){
  var data = fs.readFileSync(filePath);

  var {ext} = path.parse(filePath);
  ext = ext.substring(1);

  switch(ext){
    case 'js':
      data = O.sanl(data.toString()).map(line => {
        return line.trim();
      }).join('\n');
      break;
  }

  var encrypted = encrypt(data);

  return encrypted;
}

function encrypt(data){
  var buff = encryptor.encrypt(data);
  var str = buff.toString('hex');

  str = str.match(LINE_REGEX).join('\n');

  return str;
}