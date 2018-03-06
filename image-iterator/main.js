'use strict';

var O = require('../framework');
var ImageData = require('../image-data');
var logStatus = require('../log-status');
var imageIterator = require('.');

var w = 1920;
var h = 1080;

var input = '-dw/images';
var output = '-img/1.png';

setTimeout(main);

function main(){
  var d;

  imageIterator.iterate(input, output, w, h, (w1, h1, g, g1, f, n) => {
    logStatus(f, n, 'image');

    var d1 = new ImageData(g1);

    if(f === 1){
      d = new ImageData(g);
      d.iterate((x, y) => d1.get(x, y));
    }else{
      d.iterate((x, y, ...col) => {
        var col1 = d1.get(x, y);

        return col.map((a, b) => {
          b = col1[b];
          return a & b;
        });
      });
    }

    if(f === n){
      d.put();
    }
  });
}