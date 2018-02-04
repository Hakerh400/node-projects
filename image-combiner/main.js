'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');

var size = 5;

setTimeout(main);

function main(){
  var dir = 'C:/Users/Thomas/Downloads';
  var files = fs.readdirSync(dir);

  var file1 = path.join(dir, files.splice(O.rand(files.length), 1)[0]);
  var file2 = path.join(dir, files.splice(O.rand(files.length), 1)[0]);
  var file3 = path.join(dir, files.splice(O.rand(files.length), 1)[0]);

  media.editImage(file1, '-', (w, h, g1) => {
    media.editImage(file2, '-', (w, h, g2) => {
      media.editImage(file3, '-img/1.png', (w, h, g3) => {
        var d1 = new ImageData(g1);
        var d2 = new ImageData(g2);
        var d3 = new ImageData(g3);

        d3.iterate((x, y) => {
          if(!x) logStatus(y + 1, h, 'row');

          var c1 = d1.get(x + O.rand((size << 1) + 1) - size, y + O.rand((size << 1) + 1) - size);
          var c2 = d2.get(x + O.rand((size << 1) + 1) - size, y + O.rand((size << 1) + 1) - size);
          var c3 = d3.get(x + O.rand((size << 1) + 1) - size, y + O.rand((size << 1) + 1) - size);

          return func(c1, c2, c3);
        });

        d3.put();
      });
    });
  });
}

function func([r1, g1, b1], [r2, g2, b2], [r3, g3, b3]){
  return [
    (r1 ** 2 & r2 ** 2 & r3 ** 2) ** .5,
    (g1 ** 2 & g2 ** 2 & g3 ** 2) ** .5,
    (b1 ** 2 & b2 ** 2 & b3 ** 2) ** .5,
  ];
}