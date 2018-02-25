'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var input = '-dw/1.png';
var output = '-img/1.png';

setTimeout(main);

function main(){
  media.editImage(input, output, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);

    var d = new ImageData(g);
    var d1 = new ImageData(g);

    d1.iterate((x, y, r, g, b) => {
      var angle = y / w * O.pi2;
      var radius = x;

      var dx = Math.cos(angle) * radius;
      var dy = Math.sin(angle) * radius;

      var xx = (w + dx) % w;
      var yy = (h + dy) % h;

      return d.get(Math.round(xx), Math.round(yy));
    });

    d1.put();
  });
}