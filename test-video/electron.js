'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const HD = 0;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const inputFile = '-dw/1.png';
const outputFile = getOutputFile();

setTimeout(() => main().catch(log));

async function main(){
  const img = await media.loadImage(inputFile);
  let imgd = null;
  let pixels = null;

  const init = g => {
    const data = new O.ImageData(img);

    pixels = O.ca(w * h, i => {
      const x = i % w + .5;
      const y = (i / w | 0) + .5;
      const col = new Uint8ClampedArray(3);

      data.get(x, y, col);

      return [x, y, col];
    });

    imgd = new O.ImageData(g);
  };

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);
    if(f === 1) init(g);

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);
    imgd.fetch();

    for(const pix of pixels){
      const [x, y, col] = pix;
      imgd.set(x | 0, y | 0, col);

      const n = .01;
      pix[0] += O.randf(-n, n);
      pix[1] += O.randf(-n, n);
    }

    imgd.put();

    return f !== framesNum;
  }, () => {
    O.exit();
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}