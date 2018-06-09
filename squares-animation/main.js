'use strict';

var O = require('../framework');
var media = require('../media');

const OFFSET = .5;
const SCALE = 1 / 50;
const K_MIN = .1;
const K_MIN_1 = K_MIN + 1;

var imgFile = 'C:/Documents/images/2.png';

var s = 40;
var sh = s / 2;

var fps = 60;

setTimeout(main);

function main(){
  var w, h, g;

  media.editImage(imgFile, '-', (...args) => {
    [w, h, g] = args;
  }, () => {
    renderVideo(w, h, g.canvas);
  });
}

function renderVideo(w, h, canvas){
  var [ws, hs] = [w, h].map(a => a / s);

  var start = -(w * OFFSET);
  var end = w * (OFFSET + 1);
  var pos = start;

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(pos - start + 1, end - start + 1);

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    for(var xSrc = 0; xSrc < w; xSrc += s){
      var xx = xSrc + sh;
      var k = (Math.tanh((xx - pos) * SCALE) ** 2 + K_MIN) / K_MIN_1;
      var ss = s * k;

      for(var ySrc = 0; ySrc < h; ySrc += s){
        var x = xSrc + (s - ss) / 2;
        var y = ySrc + (s - ss) / 2;

        g.drawImage(canvas, xSrc, ySrc, s, s, x, y, ss, ss);
      }
    }

    return pos++ !== end;
  });
}