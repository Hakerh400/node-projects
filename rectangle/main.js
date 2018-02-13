'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 640;
var h = 480;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate((x, y) => {
      var arr = O.ca(3, () => 0);
      var i = 0;

      x /= w;
      y /= h;

      var a1 = x <= y;
      var a2 = 1 - x < y;

      i = (a2 << 1) | (a1 ^ a2);

      if(i) arr[i - 1] = 255;
      return arr;
    });

    d.put();
  });
}