'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const DENSITY = 1e3;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const outputFile = getOutputFile();

setTimeout(() => main().catch(log));

async function main(){
  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    const arr = O.ca(w, () => 0);
    let max = 0;

    O.repeat(w * DENSITY, (i, k) => {
      let j = func(k) * w + .5 | 0;
      if(j < 0 || j >= w) return;
      if(arr[j]++ === max) max++;
    });

    if(max === 0) return;

    g.fillStyle = 'red';

    arr.forEach((n, x) => {
      let k = (1 - n / max) * h;
      g.fillRect(x, k, 1, h - k);
    });
  });
}

function func(k){
  return (2 ** k - 1) ** 2;
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}