'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var media = require('../media');
var jarExtractor = require('../jar-extractor');
var fsRec = require('../fs-recursive');
var formatFileName = require('../format-file-name');
var logStatus = require('../log-status');

var tileSize = 16;
var imageExtension = 'png';

var game = 'minecraft';
var defaultJarVersionsDir = `C:/Users/Thomas/AppData/Roaming/.${game}/versions`;
var jarTexturesDir = `assets/${game}/textures/blocks`;

module.exports = {
  convert,
};

function convert(input = null, output, cb = O.nop){
  if(input === null){
    prepareDefaultInput(output, cb);
    return;
  }

  input = formatFileName(input);
  output = formatFileName(output);

  var imageFiles = fs.readdirSync(input);

  imageFiles = imageFiles.filter(name => {
    var ext = path.parse(name).ext.substring(1);
    return ext === imageExtension;
  });

  var f = 0;
  var n = imageFiles.length;

  var images = [];

  processImage();

  function processImage(){
    if(f === n)
      return saveTextures();

    logStatus(f + 1, n, 'image');

    var imageFile = imageFiles[f++];
    imageFile = path.join(input, imageFile);

    var acceptable = true;

    media.editImage(imageFile, '-', (w, h, g) => {
      if(w === tileSize && h === tileSize)
        images.push(g);
    }, processImage);
  }

  function saveTextures(){
    if(images.length === 0)
      return cbErr(cb);

    var size = Math.ceil(images.length ** .5);
    var w = size * tileSize;
    var h = size * tileSize;

    media.renderImage(output, w, h, (w, h, g) => {
      g.clearRect(0, 0, w, h);

      images.forEach((image, index) => {
        var x = (index % size | 0) * tileSize;
        var y = (index / size | 0) * tileSize;

        g.drawImage(image.canvas, x, y);
      });
    }, callCb);
  }

  function callCb(){
    setTimeout(() => {
      cb(null);
    });
  }
}

function prepareDefaultInput(output, cb = O.nop){
  var version = getLatestVersion();
  if(version === null) return cbErr(cb);

  var dir = path.join(defaultJarVersionsDir, version);
  var jarFile = path.join(dir, `${version}.jar`);
  if(!fs.existsSync(jarFile)) return cbErr(cb);

  jarExtractor.extract(jarFile, null, (err, outputDir) => {
    if(err) return cbErr(cb);

    var input = path.join(outputDir, jarTexturesDir);
    convert(input, output, cb);
  });
}

function getLatestVersion(){
  var dir = defaultJarVersionsDir;
  if(!fs.existsSync(dir)) return null;

  var dirs = fs.readdirSync(dir);
  dirs = dirs.filter(a => /^\d+(?:\.\d+)*$/.test(a));
  dirs = dirs.map(a => a.split`.`.map(a => a | 0));
  if(dirs.length === 0) return null;

  var version = dirs.reduce((a, b) => {
    var dLen = a.length - b.length;

    if(dLen !== 0){
      O.repeat(dLen, () => {
        if(dLen > 0) b.push(0);
        else a.push(0);
      });
    }

    for(var i = 0; i < a.length; i++){
      if(a[i] > b[i]) return a;
      if(b[i] > a[i]) return b;
    }
  });

  version = version.join`.`;

  return version;
}

function cbErr(cb = O.nop){
  var error = new Error('Error occured.');
  setTimeout(() => cb(error));
}