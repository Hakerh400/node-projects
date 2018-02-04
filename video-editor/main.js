'use strict';

var media = require('../media');
var logStatus = require('../log-status');

var input = '-dw/1.avi';
var output = '-vid/1.mp4';

var w = 1024;
var h = 768;
var fps = 24;
var hd = false;

setTimeout(main);

function main(){
  media.editVideo(input, output, w, h, fps, hd, (w1, h1, w2, h2, g1, g2, f, framesNum) => {
    logStatus(f, framesNum);

    g2.drawImage(g1.canvas, 0, 0);
  });
}