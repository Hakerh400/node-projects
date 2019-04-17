'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const w = 100;
const h = 100;
const fps = 60;
const fast = 0;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 1;
const framesNum = fps * duration;

const outputFile = getOutputFile(1);

setTimeout(main);

function main(){
  media.renderVideo(outputFile, w, h, fps, 1, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      g.fillStyle = 'white';
      g.fillRect(0, 0, w, h);

      g.scale(-w, h);
      g.font = '.4px arial';
      g.fillStyle = 'black';
      g.fillText('1', -.75, .25);
      g.fillText('2', -.25, .25);
      g.fillText('3', -.75, .75);
      g.fillText('4', -.25, .75);
    }

    return f !== framesNum;
  }, () => window.close());
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}