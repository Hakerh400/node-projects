'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 1920;
var h = 1080;

setTimeout(main);

function main(){
  var tx = -.1;
  var ty = .836900029;
  var s = .5e-14;

  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);
    var d = new ImageData(g);

    d.iterate((x, y) => {
      if(x === 0)
        media.logStatus(y + 1, h, 'row');

      x = (x - wh) / 500;
      y = -(y - hh) / 500;

      x = (x * s) + tx;
      y = (y * s) + ty;

      var a = 10 ** (1 / (1e-8 - 1));
      var b = Math.log(100) / Math.log(a) - 1;

      var iters = Math.round(a ** (b + s));

      var v = calc(x, y, iters);
      if(v === 1)
        return [0, 0, 0];

      var col = O.hsv(v);
      return col;
    });

    d.put();
  });
}

function calc(x, y, iters){
  var cx = x;
  var cy = y;
  var zx = 0;
  var zy = 0;

  for(var i = 0; i < iters; i++){
    x = zx * zx - zy * zy + cx;
    y = 2 * zx * zy + cy;

    zx = x;
    zy = y;

    if(zx * zx + zy * zy > 2 ** 2)
      break;
  }

  return i / iters;
}