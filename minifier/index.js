'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var formatFileName = require('../format-file-name');

module.exports = {
  minify,
};

function minify(input, output, cb = O.nop){
  input = formatFileName(input);
  output = formatFileName(output);

  if(fs.existsSync(output)){
    fsRec.deleteFilesSync(output);
  }

  fs.mkdirSync(output);

  fsRec.processFilesSync(input, d => {
    if(d.processed) return;

    var inputPath = d.fullPath;
    var relativePath = d.relativePath.split(/[\/\\]/).slice(1).join`\\`;
    if(!relativePath) return;

    var outputPath = path.join(output, relativePath);

    if(d.isDir){
      fs.mkdirSync(outputPath);
    }else{
      var data = fs.readFileSync(inputPath);
      var ext = path.parse(d.name).ext.substring(1);

      if(ext === 'js'){
        data = minifyFile(data);
      }

      fs.writeFileSync(outputPath, data);
    }
  });
}

function minifyFile(data){
  var str = data.toString();

  str = str.split(/\r\n|\r|\n/);

  str = str.map(line => {
    line = line.trim();

    if(line.includes('//')){
      line += '\n';
    }else if(line.length !== 0){
      line += ' ';
    }

    return line;
  });

  str = str.join``;

  return str;
}