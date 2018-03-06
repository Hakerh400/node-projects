'use strict';

var fs = require('fs');
var path = require('path');
var {Canvas} = require('../media/node_modules/canvas');
var O = require('../framework');
var media = require('../media');
var formatFileName = require('../format-file-name');

module.exports = {
  iterate,
};

function iterate(input, output, w, h, func, cb = O.nop){
  input = formatFileName(input);
  output = formatFileName(output);

  var images = fs.readdirSync(input);
  images = images.map(image => path.join(input, image));

  var f = 1;
  var n = images.length;
  var g = media.createContext(w, h);

  scheduleNextImage();

  function processImage(){
    if(images.length === 0) return saveImage();

    var image = images.shift();

    media.editImage(image, '-', (w1, h1, g1) => {
      var g2 = media.createContext(w, h);
      g2.drawImage(g1.canvas, 0, 0, w1, h1, 0, 0, w, h);
      func(w1, h1, g, g2, f++, n);
    }, scheduleNextImage);
  }

  function scheduleNextImage(){
    setTimeout(processImage);
  }

  function saveImage(){
    media.renderImage(output, w, h, (w, h, g1) => {
      g1.drawImage(g.canvas, 0, 0);
    }, finish);
  }

  function finish(){
    cb(null);
  }
}