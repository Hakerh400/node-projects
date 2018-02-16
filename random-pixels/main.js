'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 400;
var h = 400;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate(() => O.ca(3, () => O.rand(256)));

    d.put();
  });
}