'use strict';

const O = require('../framework');
const media = require('../media');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const duration = 60 * 60;
const framesNum = fps * duration;

const col = Buffer.from([255, 0, 0]);

setTimeout(main);

function main(){
  var d;

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    var imgd = g.getImageData(0, 0, w, h);
    var data = imgd.data;

    data.forEach((a, b) => {
      if((b & 3) === 3) data[b] = 255;
      else data[b] = col[b & 3];
    });

    g.putImageData(imgd, 0, 0);

    return f !== framesNum;
  });
}