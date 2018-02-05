'use strict';

var media = require('../media');
var logStatus = require('../log-status');
var formatTime = require('../format-time');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60 * 60;
var framesNum = fps * duration;

var fontSize = 100;

setTimeout(main);

function main(){
  var wh, hh;
  var textSize;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f == 1){
      [wh, hh] = [w, h].map(a => a >> 1);

      g.textBaseline = 'middle';
      g.textAlign = 'left';
      g.font = `${fontSize}px arial`;

      textSize = g.measureText(formatTime(0)).width / 2;
    }

    if(!((f - 1) % fps)){
      g.fillStyle = 'black';
      g.fillRect(0, 0, w, h);

      g.fillStyle = 'darkgray';
      g.fillText(formatTime((f - 1) / fps), wh - textSize, hh);
    }

    return f != framesNum;
  });
}