'use strict';

var fs = require('fs');
var {Canvas, registerFont} = require('./node_modules/canvas');

const MAX_IMAGE_SIZE = 32767;

[
  [0, 0],
  [1, 0],
  [MAX_IMAGE_SIZE, 0],
  [MAX_IMAGE_SIZE + 1, 0],
  [MAX_IMAGE_SIZE, MAX_IMAGE_SIZE],
  [MAX_IMAGE_SIZE + 1, MAX_IMAGE_SIZE],
  [MAX_IMAGE_SIZE + 1, MAX_IMAGE_SIZE + 1],
  [2 ** 30, 0],
  [2 ** 30, 1],
  [2 ** 32, 0],
  [2 ** 32, 1],
].forEach(size => {
  log(size.join(' ') + ' ');

  try{
    var canvas = new Canvas(size[0], size[1]);
    log('#1 ');

    var ctx = canvas.getContext('2d');
    log('#2 ');

    ctx.getImageData(0, 0, 1, 1);
    log('#3\n');
  }catch(err){
    log(`${err.message}\n`);
  }
});

function log(str){
  fs.writeSync(process.stdout.fd, `${str}`);
}