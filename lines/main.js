'use strict';

var O = require('../framework');
var media = require('../media');
var logStatus = require('../log-status');

var w = 640;
var h = 480;
var fps = 60;
var hd = true;
var duration = 60 * 10;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  var arr = O.ca(w, () => 0)
  var x, y;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.lineJoin = 'round';
    }

    y = 0;
    for(x = 0; x < w; x++){
      arr[x] += y;
      y = Math.max(y, rand(h));
    }

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    g.strokeStyle = 'yellow';
    g.beginPath();
    y = 1;
    for(x = 0; x < w; x++){
      g.lineTo(x, (1 - y) * h);
      y = y * (2 - y) / 2;
    }
    g.stroke();

    g.strokeStyle = 'red';
    g.beginPath();
    for(x = 0; x < w; x++){
      g.lineTo(x, arr[x] / f);
    }
    g.stroke();

    return f != framesNum;
  });
}

function rand(a){
  return Math.random() ** 20 * a;
}