'use strict';

var O = require('../framework');
var media = require('../media');
var ImageData = require('../image-data');

var w = 1920;
var h = 1080;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    g.rotate(NaN);
    g.resetTransform();

    g.fillStyle = 'red';
    g.fillRect(0, 0, 100, 100);
  });
}