'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

const MAX_DIFF = 1;

var w = 1920;
var h = 1080;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var [wh, hh] = [w, h].map(a => a >> 1);
    var d = new ImageData(g);

    d.iterate((x, y) => {
      if(x === 0)
        media.logStatus(y + 1, h, 'row');

      x = (x - wh) / 100;
      y = -(y - hh) / 100;

      var sx = x >= 0 ? 1 : -1;
      var sy = y >= 0 ? 1 : -1;

      x *= sx;
      y *= sy;

      var fps = 60;
      var f = 1;

      var angle = (f - 1) / fps * O.pi2;

      var e1 = 1 + Math.sin(angle) * .2;
      var e2 = 1 + Math.sin(angle * .9 + O.pih) * .2;
      var e3 = 1 + Math.sin(angle * .8 - O.pih) * .2;

      var col = [
        calc(sx * x ** e1, sy * y ** e1),
        calc(sx * x ** e2, sy * y ** e2),
        calc(sx * x ** e3, sy * y ** e3),
      ];

      return col.map(a => Math.round(a * 255));
    });

    d.put();
  });
}

function calc(x, y){
  var lhs = Math.sin(x * y - x - y);
  var rhs = Math.sin(x * x + y * y);

  var diff = Math.abs(lhs - rhs);
  if(diff > MAX_DIFF)
    return 0;

  diff = 1 - diff / MAX_DIFF;

  return diff;
}