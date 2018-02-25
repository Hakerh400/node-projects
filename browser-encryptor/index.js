'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var formatFileName = require('../format-file-name');
var encryptor = require('./encryptor.js');

module.exports = {
  encrypt,
};

function encrypt(inputDir, outputDir, password, cb = O.nop){
  inputDir = formatFileName(inputDir);
  outputDir = formatFileName(outputDir);

  var dirs = fs.readdirSync(inputDir).filter(dir => {
    if(dir.endsWith('_')) return false;
    dir = path.join(inputDir, dir);
    return fs.statSync(dir).isDirectory();
  });

  dirs.forEach(dir => {
    var inputPath = path.join(inputDir, dir);
    var outputPath = path.join(outputDir, dir);
    var files = fs.readdirSync(inputPath);

    if(fs.existsSync(outputPath)){
      fsRec.deleteFilesSync(outputPath);
    }

    fs.mkdirSync(outputPath);

    files.forEach(file => {
      var inputFile = path.join(inputPath, file);
      var outputFile = path.join(outputPath, file);
      var ext = path.parse(file).ext.substring(1);
      var content = fs.readFileSync(inputFile);

      content = encryptor.encrypt(content, password);
      fs.writeFileSync(outputFile, content);
    });
  });

  setTimeout(() => {
    cb(null);
  });
}