'use strict';

var media = require('../media');
var logStatus = require('../log-status');
var PhysicsEngine = require('.');

var w = 640;
var h = 480;
var fps = 60;
var hd = true;

var duration = 10;
var framesNum = duration * fps;

setTimeout(main);

function main(){
  var pe = new PhysicsEngine(w, h);

  media.renderVideo('-vid/2.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);
    return f != framesNum;
  });
}