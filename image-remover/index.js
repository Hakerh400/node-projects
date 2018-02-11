'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var tempDir = require('../temp-dir')(__filename);
var renderImage = require('./render-image.js');
var supportedExtensions = require('./supported-extensions.json');

var indicatorFile = '1.hex';
var imageFileName = '1';

module.exports = {
  remove
};

function remove(input, output, cb = O.nop){
  input = path.normalize(input);
  output = path.normalize(output);

  if(!checkImages()){
    return createImages(err => {
      if(err) return cb(err);
      remove(input, output, cb);
    });
  }

  if(fs.existsSync(output)){
    fsRec.deleteFilesSync(output);
  }

  fs.mkdirSync(output);

  fsRec.processFilesSync(input, d => {
    if(d.fullPath == input) return;
    if(d.processed) return;

    var relativePath = d.relativePath;
    relativePath = relativePath.split(/[\/\\]/).slice(1);
    relativePath = relativePath.join`\\`;

    var outputPath = path.join(output, relativePath);

    if(d.isDir){
      fs.mkdirSync(outputPath);
    }else{
      var data = fs.readFileSync(d.fullPath);
      var ext = path.parse(d.name).ext.substring(1);

      if(supportedExtensions.some(e => e == ext)){
        var imagePath = getImagePath(ext);
        data = fs.readFileSync(imagePath);
      }

      fs.writeFileSync(outputPath, data);
    }
  });

  cb(null);
}

function checkImages(){
  var indicatorFilePath = getIndicatorFilePath();
  return fs.existsSync(indicatorFilePath);
}

function createImages(cb = O.nop){
  var indicatorFilePath = getIndicatorFilePath();
  fs.writeFileSync(indicatorFilePath, '');

  var exts = [...supportedExtensions];
  createImage(null);

  function createImage(err){
    if(err) return cb(err);
    if(!exts.length) return cb(null);

    var ext = exts.shift();
    var imagePath = getImagePath(ext);

    renderImage(imagePath, createImage);
  }
}

function getImagePath(ext){
  var name = `${imageFileName}.${ext}`;
  return path.join(tempDir, name);
}

function getIndicatorFilePath(){
  return path.join(tempDir, indicatorFile);
}