'use strict';

throw 0;

var O = require('../framework');
var media = require('../media');

const A = 10 ** (1 / (1e-8 - 1));
const B = Math.log(100) / Math.log(A) - 1;

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
//var duration = 3;
//var framesNum = fps * duration;

var framesNum = 16905;

var [wh, hh] = [w, h].map(a => a >> 1);

setTimeout(main);

function main(){
  var tx = -.1;
  var ty = .836900029;
  var s = 5;

  var imgd, data;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      imgd = g.getImageData(0, 0, w, h);
      data = imgd.data;
    }

    s *= .998;
    var iters = Math.round(A ** (B + s));

    for(var y = 0, i = 0; y < h; y++){
      for(var x = 0; x < w; x++, i += 4){
        var xx = (x - wh) / 500;
        var yy = -(y - hh) / 500;

        xx = (xx * s) + tx;
        yy = (yy * s) + ty;

        var v = calc(xx, yy, iters);
        if(v === 1){
          data[i] = data[i + 1] = data[i + 2] = 0;
          continue;
        }

        var col = O.hsv(v);
        data[i] = col[0];
        data[i + 1] = col[1];
        data[i + 2] = col[2];
      }
    }

    g.putImageData(imgd, 0, 0);

    return f !== framesNum;
  });
}

function calc(x, y, iters){
  var cx = x;
  var cy = y;
  var zx = 0;
  var zy = 0;

  if(iters < 100)
    iters = 100;

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