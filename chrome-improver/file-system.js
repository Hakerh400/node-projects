'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var CommandPrompt = require('./command-prompt.js');
var asyncFuncs = require('./async-funcs.js');
var nop = require('./nop.js');

module.exports = {
  lockFile,
  deleteFile,
  removeAllPerms,
  removeAllAttribs,
  gainAdminPerms,
  deletePreparedFile,
  makeFileReadOnly,
  processMultipleFiles,
  createEmptyFile,
  doesFileExist
};

function lockFile(filePath, cb = nop){
  asyncFuncs.exec([
    deleteFile,
    createEmptyFile,
    removeAllAttribs,
    makeFileReadOnly,
    removeAllPerms
  ], [filePath], cb);
}

function deleteFile(filePath, cb = nop){
  doesFileExist(filePath, (err, exists) => {
    if(err) return cb(err);
    if(!exists) return cb();

    asyncFuncs.exec([
      removeAllPerms,
      gainAdminPerms,
      removeAllAttribs,
      deletePreparedFile
    ], [filePath], cb);
  });
}

function removeAllPerms(filePath, cb = nop){
  var {disk, dir, fileName, escapedDir, escapedFileName} = parseFilePath(filePath);
  var cmd = new CommandPrompt(cb);
  var removePerms = [];

  cmd.execList([
    [
      [
        ...disk ? [disk] : [],
        ...dir ? [`cd ${escapedDir}`] : [],
        `takeown /f ${escapedFileName}`,
        `icacls ${escapedFileName} /inheritance:r`
      ]
    ], [
      `icacls ${escapedFileName}`,
      str => {
        generateIcaclsPermRemover(removePerms, fileName, str);
      }
    ], [
      removePerms
    ],
    ['exit']
  ]);
}

function removeAllAttribs(filePath, cb = nop){
  var attribs = 'ahirs'.split``;
  attribs = attribs.map(attrib => `-${attrib}`);
  attribs = attribs.join` `;

  var {disk, dir, fileName, escapedDir, escapedFileName} = parseFilePath(filePath);
  var cmd = new CommandPrompt(cb);

  cmd.execList([
    [
      [
        ...disk ? [disk] : [],
        ...dir ? [`cd ${escapedDir}`] : [],
        `attrib ${escapedFileName} ${attribs}`
      ]
    ],
    ['exit']
  ]);
}

function gainAdminPerms(filePath, cb = nop){
  var {disk, dir, fileName, escapedDir, escapedFileName} = parseFilePath(filePath);
  var cmd = new CommandPrompt(cb);

  cmd.execList([
    [
      [
        ...disk ? [disk] : [],
        ...dir ? [`cd ${escapedDir}`] : [],
        `icacls ${escapedFileName} /grant administrators:(f)`
      ]
    ],
    ['exit']
  ]);
}

function deletePreparedFile(filePath, cb = nop){
  fs.stat(filePath, (err, stats) => {
    if(err) return cb(err);

    if(stats.isDirectory()){
      fs.readdir(filePath, (err, files) => {
        if(err) return cb(err);

        files = files.map(file => {
          return path.join(filePath, file);
        });

        processMultipleFiles(files, deleteFile, err => {
          if(err) return cb(err);

          fs.rmdir(filePath, err => {
            if(err) return cb(err);
            cb();
          });
        });
      });
    }else{
      fs.unlink(filePath, err => {
        if(err) return cb(err);
        cb();
      });
    }
  });
}

function makeFileReadOnly(filePath, cb = nop){
  var {disk, dir, fileName, escapedDir, escapedFileName} = parseFilePath(filePath);
  var cmd = new CommandPrompt(cb);

  cmd.execList([
    [
      [
        ...disk ? [disk] : [],
        ...dir ? [`cd ${escapedDir}`] : [],
        `attrib ${escapedFileName} +r`
      ]
    ],
    ['exit']
  ]);
}

function processMultipleFiles(files, func, cb = nop){
  var funcs = O.ca(files.length, () => processOneFile);

  asyncFuncs.exec(funcs, [], cb);

  function processOneFile(cb = nop){
    var file = files.shift();

    func(file, cb);
  }
}

function createEmptyFile(filePath, cb = nop){
  fs.writeFile(filePath, '', err => {
    if(err) return cb(err);
    cb();
  });
}

function doesFileExist(filePath, cb = nop){
  var parsedFilePath = path.parse(filePath);
  var dir = parsedFilePath.dir;
  var fileName = parsedFilePath.base.toLowerCase();

  fs.readdir(dir, (err, files) => {
    if(err) return cb(err, null);

    files = files.map(file => file.toLowerCase());
    cb(null, files.includes(fileName));
  });
}

function generateIcaclsPermRemover(arr, fileName, str){
  var escapedFileName = escapeCmdString(fileName);
  var groups = parseIcaclsGroups(fileName, str);

  groups.forEach(group => {
    group = group.substring(0, group.indexOf(':'));
    group = `icacls ${escapedFileName} /remove:g "${group}"`;
    arr.push(group);
  });
}

function parseIcaclsGroups(fileName, str){
  str = str.split`\n`;
  str = str.slice(0, str.indexOf(''));

  var groups = str.map(group => group.substring(fileName.length + 1));

  return groups;
}

function parseFilePath(filePath){
  filePath = filePath.replace(/\//g, '\\');

  var parsedFilePath = path.parse(filePath);
  var disk = parsedFilePath.root;
  var dir = parsedFilePath.dir;
  var fileName = parsedFilePath.base;
  var escapedDir = escapeCmdString(dir);
  var escapedFileName = escapeCmdString(fileName);

  if(disk){
    disk = `${disk[0]}:`
  }

  return {disk, dir, fileName, escapedDir, escapedFileName};
}

function escapeCmdString(fileName){
  return `^"${fileName.replace(/[\%\^]/g, a => `^${a}`)}^"`;
}