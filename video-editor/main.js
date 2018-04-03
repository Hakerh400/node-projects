'use strict';

var media = require('../media');
var logStatus = require('../log-status');

var input = '-dw/1.mp4';
var output = '-vid/1.mp4';

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;

setTimeout(main);

function main(){
  media.editVideo(input, output, w, h, fps, hd, (w1, h1, w2, h2, g, g1, f, framesNum) => {
    logStatus(f, framesNum);

    if(f >= 366 && f <= 855){
      g.fillStyle = 'white';
      g.fillRect(682, 130, 314, 83);
    }

    if((f >= 366 && f <= 406) || (f >= 814 && f <= 855)){
      media.blurRegion(g, 213, 106, 468, 458);
    }

    if(f >= 407 && f <= 813){
      media.blurRegion(g, 500, 208, 188, 316);
    }

    g1.drawImage(g.canvas, 0, 0);
  });
}