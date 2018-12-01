'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');

const w = 1920;
const h = 1080;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate((x, y) => {
      x /= w;
      y = (y + 1) / w * 256 + .5 | 0;

      var k = (x * y + .5 | 0) / y;

      return O.hsv(k);
    });

    d.put();
  });
}