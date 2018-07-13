'use strict';

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');

const w = 1000;
const h = 1000;

const scale = 10;

const [wh, hh] = [w, h].map(a => a / 2);
const s = w / scale;

setTimeout(main);

function main(){
  var col = Buffer.alloc(3);

  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    var hsArr = O.ca(w, () => Infinity);

    d.iterate((x, y) => {
      var i = x;
      var hPrev = hsArr[i];

      x = (x - wh) / s;
      y = (y - hh) / s;

      var angle = Math.atan2(y, x);
      var sin = Math.sin(angle);
      var cos = Math.cos(angle);

      var h = hypot(x, y);

      [x, y] = [
        x * cos - y * sin,
        x * sin + y * cos,
      ];

      h *= (Math.cos(x * 3) + 2) + (Math.sin(y * 3) + 2);

      var k = Math.cos(x * h) * Math.sin(y * h);

      k = ((k % 1) + 1) % 1;
      O.hsv(k, col);

      if(h < hPrev){
        hsArr[i] = h;
      }else{
        var p = hPrev / h;
        p **= 2.1;

        col[0] *= p;
        col[1] *= p;
        col[2] *= p;
      }

      return col;
    });

    d.put();
  });
}

function hypot(x, y){
  return Math.sqrt(x * x + y * y);
}