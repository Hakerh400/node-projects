'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');

setTimeout(main);

function main(){
  media.editImage('-dw/1.png', '-', (w, h, g1) => {
    media.editImage('-dw/2.png', '-img/1.png', (w, h, g2) => {
      var d1 = new ImageData(g1);
      var d2 = new ImageData(g2);

      d2.iterate((x, y) => {
        if(!x) logStatus(y + 1, h, 'row');

        var c1 = d1.get(x + O.rand(3) - 1, y + O.rand(3) - 1);
        var c2 = d2.get(x + O.rand(3) - 1, y + O.rand(3) - 1);

        return func(c1, c2);
      });

      d2.put();
    });
  });
}

function func([r1, g1, b1], [r2, g2, b2]){
  return [
    r1 & r2,
    g1 & g2,
    b1 & b2,
  ];
}