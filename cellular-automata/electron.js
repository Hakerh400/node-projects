'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const ImageData = require('../image-data');

const w = 640;
const h = 480;
const fps = 60;
const fast = 0;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const inputFile = '-dw/1.png';
const outputFile = getOutputFile(1);

setTimeout(() => main().catch(log));

async function main(){
  const rule = O.ca(512, (i, k, n) => {
    i = i.toString(2).padStart(9, '0').split('').reverse().map(a => a | 0);

    const m = i[4];
    const s = i.reduce((a, b) => a + b, 0);

    return s < 5 ? 0 : s > 5 ? 1 : m;
  }).map(a => a ? 1 : 0);

  const col1 = Buffer.alloc(3).fill(0);
  const col2 = Buffer.alloc(3).fill(255);

  let d1 = new O.Grid(w, h, () => O.rand(2));
  let d2 = new O.Grid(w, h, () => 0);

  let imgd;

  // const img = await media.loadImage(inputFile);

  function init(g){
    // g.drawImage(img.canvas, 0, 0);
    imgd = new ImageData(g);
  }

  await new Promise(res => {
    media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
      media.logStatus(f, framesNum);
      if(f === 1) init(g);

      for(let y = 0; y !== h; y++){
        for(let x = 0; x !== w; x++){
          const prev = d1.get(x, y, 0, 0);

          const index = (
            (d1.get(x - 1, y - 1, 0, 0) << 8) |
            (d1.get(x, y - 1, 0, 0) << 7) |
            (d1.get(x + 1, y - 1, 0, 0) << 6) |
            (d1.get(x - 1, y, 0, 0) << 5) |
            (prev << 4) |
            (d1.get(x + 1, y, 0, 0) << 3) |
            (d1.get(x - 1, y + 1, 0, 0) << 2) |
            (d1.get(x, y + 1, 0, 0) << 1) |
            (d1.get(x + 1, y + 1, 0, 0) << 0)
          );

          const bit = rule[index];

          d2.set(x, y, bit);
          imgd.set(x, y, prev ? col2 : col1);
        }
      }

      [d1, d2] = [d2, d1];

      imgd.put();

      return f !== framesNum;
    }, res);
  });

  O.exit();
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}