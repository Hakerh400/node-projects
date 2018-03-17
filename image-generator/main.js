'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');

var w = 1920;
var h = 1080;

var pointsNum = 10;

setTimeout(main);

function main(){
  var points = O.ca(pointsNum, () => {
    return new O.Point(O.rand(w), O.rand(h));
  });

  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate((x, y) => {
      if(x === 0)
        logStatus(y + 1, h, 'row');

      var dists = points.map(p => {
        return Math.hypot(x - p.x, y - p.y);
      });

      var col = dists.reduce((col, dist) => {
        col[0] ^= dist;
        col[1] ^= dist ** 1.1;
        col[2] ^= dist ** 1.2;

        return col;
      }, [0, 0, 0]);

      col = col.map(a => Math.abs(a % 511 - 255));

      return col;
    });

    d.put();
  });
}