'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var buffer = require('../buffer');

var fileNamesBlackList = [
  /copyright/i,
  /copying/i,
  /license/i,
  /changelog/i,
];

var extensions = [
  ['js', /^(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['c', /^(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['h', /^(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['cc', /^(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['hh', /^(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['cpp', /^(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['css', /(?:\s*(?:\/\*[\s\S]*?\*\/))+/gm, ''],
  ['htm', /^(?:\s*(?:\<\!\-\-[\s\S]*?\-\-\>))+/gm, ''],
  ['html', /^(?:\s*(?:\<\!\-\-[\s\S]*?\-\-\>))+/gm, ''],
  ['xml', /^(?:\s*(?:\<\!\-\-[\s\S]*?\-\-\>))+/gm, ''],
];

var binaryExtensions = [
  [
    'otf',
    'ttf',
    'dll',
    'ogg',
  ],

  [
    buffer.fromHex('63 6F 70 79 72 69 67 68 74'),
    buffer.fromHex('00'),
    () => 0,
  ],
];

module.exports = {
  remove,
};

function remove(input, output){
  if(fs.existsSync(output)) fsRec.deleteFilesSync(output);
  fs.mkdirSync(output);

  fsRec.processFilesSync(input, e => {
    if(e.processed) return;

    var inputFile = e.fullPath;

    var relativePath = e.relativePath.split(/[\/\\]/).slice(1);
    var outputFile = path.join(output, relativePath.join`/`);

    var parentDir = path.join(outputFile, '..');
    var fileExtension = path.parse(inputFile).ext.substring(1);

    if(!fs.existsSync(parentDir)) return;
    if(fileNamesBlackList.some(reg => reg.test(e.name))) return;

    if(e.isDir){
      if(!fs.existsSync(outputFile)){
        fs.mkdirSync(outputFile);
      }
    }else{
      var d = fs.readFileSync(inputFile);
      var ext;

      if(ext = extensions.find(([ext]) => fileExtension == ext)){
        d = d.toString();
        d = d.replace(ext[1], ext[2]);
        d = d.trim();
      }

      if(binaryExtensions[0].some(ext => fileExtension == ext)){
        replaceBuff(d);
      }

      fs.writeFileSync(outputFile, d);
    }
  });
}

function replaceBuff(d, ext){
  var [findStart, findEnd, replaceFunc] = binaryExtensions[1];
  findStart = findStart.toString();

  replaceHexPattern(d, findStart, findEnd, replaceFunc);
  replaceHexPattern(d, capitalize(findStart), findEnd, replaceFunc);
  replaceHexPattern(d, findStart.toUpperCase(), findEnd, replaceFunc);
}

function replaceHexPattern(d, findStart, findEnd, replaceFunc){
  findStart = Buffer.from(findStart);
  findEnd = Buffer.from(findEnd);

  O.repeat(2, index => {
    if(index){
      findStart = toUnicode(findStart);
      findEnd = toUnicode(findEnd);
    }

    while(1){
      var start = d.indexOf(findStart);
      if(!~start) break;

      var end = start + d.slice(start).indexOf(findEnd);
      if(end < start) break;

      for(var i = start; i < end; i++){
        d[i] = replaceFunc(i - start);
      }
    }
  });
}

function toUnicode(buff){
  buff = buff.toString('hex');
  buff = buff.replace(/../g, a => `${a}00`);
  buff = buffer.fromHex(buff);

  return buff;
}

function capitalize(str){
  return `${str[0].toUpperCase()}${str.substring(1)}`;
}