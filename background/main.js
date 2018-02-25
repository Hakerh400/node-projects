'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 1920;
var h = 1080;

var output = '-img/1.png';

setTimeout(main);

function main(){
  media.renderImage(output, w, h, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);

    var cols = [
      [135, 206, 235],
      [239, 255, 240],
    ];

    var d = new ImageData(g);
    var d1 = new ImageData(g);

    d1.iterate((x, y) => {
      return O.ca(3, i => {
        var f1 = 1 - y / (h - 1);
        var f2 = 1 - f1;

        return cols[0][i] * f1 + cols[1][i] * f2;
      });
    });

    d1.put();
  });
}