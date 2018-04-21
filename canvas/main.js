'use strict';

var fs = require('fs');
var O = require('../framework');
var media = require('../media');
var {Canvas, registerFont} = require('./node_modules/canvas');

var w = 640;
var h = 480;

media.renderImage('-img/1.png', w, h, (w, h, g1) => {
  new Canvas(1e9, 1e9).getContext('2d').getImageData(0, 0, 1, 1);
  return;

  /////////////////////////////////////////////////////////////////

  var imgd = g.getImageData(0, 0, w, h);
  var buff = Buffer.from(imgd.data);

  imgd = g1.getImageData(0, 0, w, h);
  buff.forEach((a, b) => imgd.data[b] = a);
  g1.putImageData(imgd, 0, 0);
});

function log(str){
  fs.writeSync(process.stdout.fd, `${str}\n`);
}