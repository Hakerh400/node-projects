'use strict';

var fs = require('fs');
var path = require('path');
var fsRec = require('../fs-recursive');
var buffer = require('../buffer');

var fileNamesBlackList = [
  /copyright/i,
  /copying/i,
  /license/i,
  /changelog/i,
];

var extensions = [
  ['js', /(?:\s*(?:\/\/.*(?:\r\n|\r|\n)|\/\*[\s\S]*?\*\/))+/gm, ''],
  ['css', /(?:\s*(?:\/\*[\s\S]*?\*\/))+/gm, ''],
  ['htm', /(?:\s*(?:\<\!\-\-[\s\S]*?\-\-\>))+/gm, ''],
  ['html', /(?:\s*(?:\<\!\-\-[\s\S]*?\-\-\>))+/gm, ''],
  ['xml', /(?:\s*(?:\<\!\-\-[\s\S]*?\-\-\>))+/gm, ''],
];

var binaryExtensions = [
  ['otf', buffer.fromHex('43 6F 70 79 72 69 67 68 74'), buffer.fromHex('00 00'), () => 0],
];

module.exports = {
  remove
};

function remove(input, output){
  if(fs.existsSync(output)) fsRec.deleteFilesSync(output);
  fs.mkdirSync(output);

  fsRec.processFilesSync(input, e => {
    if(e.processed) return;

    var inputFile = e.fullPath;
    var outputFile = path.join(output, e.relativePath);
    var parentDir = path.join(outputFile, '..');
    var fileExtension = path.parse(inputFile).ext.substring(1);

    if(!fs.existsSync(parentDir)) return;
    if(fileNamesBlackList.some(reg => reg.test(e.name))) return;

    if(e.isDir){
      fs.mkdirSync(outputFile);
    }else{
      var d = fs.readFileSync(inputFile);
      var ext;

      if(ext = extensions.find(([ext]) => fileExtension == ext)){
        d = d.toString();
        d = d.replace(ext[1], ext[2]);
      }

      if(ext = binaryExtensions.find(([ext]) => fileExtension == ext)){
        var start = d.indexOf(ext[1]);
        var end = start + d.slice(start).indexOf(ext[2]);

        for(var i = start; i < end; i++){
          d[i] = ext[3](i - start);
        }
      }

      fs.writeFileSync(outputFile, d);
    }
  });
}