'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var O = require('../framework');
var fsRec = require('../fs-recursive');

module.exports = unzip;

function unzip(input, output, cb = O.nop){
  if(!fs.existsSync(input)) return cb('Cannot find input folder.');

  var files = fs.readdirSync(input).filter(name => {
    return path.parse(name).ext.substring(1) == 'hex';
  });

  if(!files.length) return cb('Input folder is empty.');
  if(files.length > 1) return cb('Found multiple files.');

  var inputFile = path.join(input, files[0]);
  var name = path.parse(inputFile).name;
  var outputFile = path.join(output, `${name}.txt`);

  if(fs.existsSync(output)){
    fsRec.deleteFilesSync(output);
  }

  fs.mkdirSync(output);

  createUnzipStream(inputFile, outputFile, cb);
}

function createUnzipStream(input, output, cb = O.nop){
  var fsInputStream = fs.createReadStream(input);
  var fsOutputStream = fs.createWriteStream(output);
  var zlibStream = zlib.createGunzip();

  fsInputStream.pipe(zlibStream);
  zlibStream.pipe(fsOutputStream);

  fsOutputStream.on('close', () => {
    cb(null);
  });
}