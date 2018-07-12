'use strict';

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');

const w = 1000;
const h = 1000;

const [wh, hh] = [w, h].map(a => a / 2);

setTimeout(main);

function main(){
  var col1 = Buffer.alloc(3);
  var col2 = Buffer.alloc(3);

  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate((x, y) => {
      x -= wh;
      y -= hh;

      var m = w / 5;
      var k = Math.hypot(x, y) / m;

      var angle = Math.atan2(y, x) - O.pih;

      var k1 = Math.sin(angle * (~~k + 5)) + 1;
      var k2 = Math.sin(angle * (-~k + 5)) + 1;

      var kp = k % 1;
      k += k1 * (1 - kp) + k2 * kp;

      k **= 2.1;

      O.hsv(k % 1, col1);

      k = Math.hypot(x, y) / m;
      k += Math.cos(angle * 5) + 1;

      O.hsv(k % 1, col2);

      col1[0] ^= col2[0];
      col1[1] ^= col2[1];
      col1[2] ^= col2[2];

      return col1;
    });

    d.put();
  });
}