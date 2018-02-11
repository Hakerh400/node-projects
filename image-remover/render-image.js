'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var colToRgb = require('../col2rgb');

var w = 1;
var h = 1;
var bgCol = 'black';

module.exports = renderImage;

function renderImage(imagePath, cb = O.nop){
  var col = colToRgb(bgCol);

  media.renderImage(imagePath, w, h, (w, h, g) => {
    var d = new ImageData(g, true);

    d.iterate(() => {
      return col;
    });

    d.put();
  }, () => {
    cb(null);
  });
}