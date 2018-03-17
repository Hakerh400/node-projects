'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');
var logStatus = require('../log-status');
var randomSum = require('.');

var w = 640;
var h = 480;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate((x, y) => {
      if(x === 0)
        logStatus(y + 1, h, 'row');

      var sum = Math.hypot(x, y) % (255 * 3 + 1) | 0;
      var col = randomSum(sum, 3, 255);

      return col;
    });

    d.put();
  });
}