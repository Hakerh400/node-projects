'use strict';

var {Canvas} = require('canvas');

var g = new Canvas(2, 2).getContext('2d');

var fs = require('fs')
  , out = fs.createWriteStream(__dirname + '/text.png')
  , stream = g.canvas.pngStream();

stream.on('data', function(chunk){
  out.write(chunk);
});

stream.on('end', function(){
  console.log('The PNG stream ended');
  //out.end();
});

out.on('finish', function(){
  console.log('The PNG file was created.');
});