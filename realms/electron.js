'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 1;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 60 * 60;
const framesNum = fps * duration;

const outputFile = getOutputFile();

setTimeout(main);

function main(){
  O.iw = w;
  O.ih = h;

  global.O = O;
  require('C:/wamp/www/projects/realms/main.js');
  const canvas = document.querySelector('canvas');

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    O.time = f / fps * 1e3;
    O.animFrame();
    
    return f !== framesNum;
  }, () => O.exit(), {canvas});
}

function getOutputFile(vid=0){
  if(vid) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}