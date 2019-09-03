'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const media = require('../media');
const format = require('../format');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = 0;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 80
const framesNum = fps * duration;

const outputFile = getOutputFile(1);

setTimeout(main);

function main(){
  O.iw = w;
  O.ih = h;

  global.O = O;
  require(format.path('-wamp/projects/grid-esolang/main.js'));
  const canvas = O.qs('canvas');

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    O.time = f / fps * 1e3;
    O.animFrame();
    
    return f !== framesNum;
  }, () => O.exit(), {canvas});
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}