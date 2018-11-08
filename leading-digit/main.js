'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const ld = require('.');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = (h + 1) / fps;
const framesNum = fps * duration;

const outputFile = getOutputFile(1);

setTimeout(main);

function main(){
  var col = Buffer.alloc(3);
  var d;

  var [wh, hh] = [w, h].map(a => a >> 1);

  function init(g){
    d = new ImageData(g);
  }

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      init(g);
      return 1;
    }

    var y = f - 2;

    for(var x = 0; x !== w; x++){
      var a = O.dist(x, y, wh, hh) | 0;
      var b = x + y;

      var n = ld.calc(a, b, 2);
      var k = n / 2048 % 1;

      O.hsv(k, col);
      d.set(x, y, col);
    }

    d.put();

    return f !== framesNum;
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}