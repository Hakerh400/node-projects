'use strict';

var media = require('../media');
var {Canvas, registerFont} = require('./node_modules/canvas');

var w = 640;
var h = 480;

media.renderImage('-img/1.png', w, h, (w, h, g1) => {
  var g = new Canvas(w, h).getContext('2d');

  g.fillStyle = 'white';
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'red';
  g.fillRect(0, 0, 10, 10);
  g.drawImage(g.canvas, 10, 10);

  /////////////////////////////////////////////////////////////////

  var imgd = g.getImageData(0, 0, w, h);
  var buff = Buffer.from(imgd.data);

  imgd = g1.getImageData(0, 0, w, h);
  buff.forEach((a, b) => imgd.data[b] = a);
  g1.putImageData(imgd, 0, 0);
});