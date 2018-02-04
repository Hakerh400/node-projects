'use strict';

var media = require('../media');
var logStatus = require('../log-status');
var server = require('./server.js');

var w = 640;
var h = 480;
var fps = 60;
var hd = true;
var duration = 10;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  server.create();
  return;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    g.fillStyle = 'red';
    g.fillRect(0, 0, f - 1, f - 1);

    return f != framesNum;
  });
}