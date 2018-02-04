'use strict';

var fs = require('fs');
var path = require('path');
var fsRec = require('../fs-recursive');
var minifier = require('.');

var input = 'C:/Users/Thomas/Downloads/www';
var output = 'C:/wamp/www';

setTimeout(main);

function main(){
  if(fs.existsSync(output)){
    fsRec.deleteFilesSync(output);
  }

  fsRec.processFilesSync(input, d => {
    if(!d.isDir && path.parse(d.name).ext.slice(1) == 'js'){
      var data = fs.readFileSync(d.fullPath);
      minifier.minify(data.toString(), false);
    }
  });

  fsRec.processFilesSync(input, d => {
    if(d.processed) return;

    var relativePath = d.relativePath.split`\\`.slice(1).join`\\`;
    var outputPath = path.join(output, relativePath);

    if(d.isDir){
      fs.mkdirSync(outputPath);
    }else{
      var data = fs.readFileSync(d.fullPath);

      if(path.parse(d.name).ext.slice(1) == 'js'){
        data = minifier.minify(data.toString(), true);
      }

      fs.writeFileSync(outputPath, data);
    }
  });
}