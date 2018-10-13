'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const blank = require('.');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 10;
const framesNum = fps * duration;

const inputFile = '-dw/1.png';
const outputFile = getOutputFile();

setTimeout(main);

async function main(){
  var img = await media.loadImage(inputFile);

  function init(g){
    g.drawImage(img.canvas, 0, 0);
  }

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1) init(g);

    return f !== framesNum;
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}