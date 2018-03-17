'use strict';

var O = require('../framework');
var media = require('../media');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60 * 60;
var framesNum = fps * duration;

var offset = 5;
var fontSize = 32;

setTimeout(main);

function main(){
  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';
      g.font = `${fontSize}px arial`;
    }

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    g.fillStyle = 'darkgray';
    g.fillText(`Current frame: ${f}`, offset, offset);
    g.fillText(`Total frames: ${framesNum}`, offset, offset + fontSize);
    g.fillText(`FPS: ${fps}`, offset, offset + fontSize * 2);

    return f !== framesNum;
  });
}