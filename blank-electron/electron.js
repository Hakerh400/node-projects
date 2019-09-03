'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const media = require('../media');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 60 * 10;
const framesNum = fps * duration;

const outputFile = getOutputFile();

setTimeout(main);

function main(){
  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);
    return f !== framesNum;
  }, () => O.exit());
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}