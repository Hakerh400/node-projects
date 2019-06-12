'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const ImageData = require('../image-data');

const {abs, round, sin, cos} = Math;

const HD = 1;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 120;
const framesNum = fps * duration;

const inputFile = '-dw/1.png';
const outputFile = getOutputFile(1);

setTimeout(() => main().catch(log));

async function main(){
  const size = 5;
  const sizeh = size >> 1;
  const sizes = size ** 2;
  const sizesh = sizes >> 1;

  const col1 = Buffer.alloc(3).fill(0);
  const col2 = Buffer.alloc(3).fill(255);

  let imgd;
  let d1, d2;

  // const img = await media.loadImage(inputFile);

  function init(g){
    // g.drawImage(img.canvas, 0, 0);
    imgd = new ImageData(g);

    d1 = new O.Grid(w, h, (x, y) => {
      return O.rand(2);
    });

    d2 = new O.Grid(w, h, () => 0);
  }

  await new Promise(res => {
    media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
      media.logStatus(f, framesNum);
      if(f === 1) init(g);

      for(let y = 0; y !== h; y++){
        for(let x = 0; x !== w; x++){
          const prev = d1.get(x, y, 0, 0);

          let sum = 0;
          for(let j = 0; j != size; j++)
            for(let i = 0; i != size; i++)
              sum += d1.get(x - sizeh + i, y - sizeh + j, 1, 0);

          let next = sum > sizesh;

          if(f & 1){
            const angle = f * O.pi / 200;
            const xStart = wh + cos(angle) * 100;
            const yStart = hh + sin(angle) * 100;

            if(O.dist(x, y, xStart, yStart) < 100){
              const angle = O.pi / 200;
              const s = sin(angle);
              const c = cos(angle);
              const x1 = x - xStart;
              const y1 = y - yStart;
              const x2 = round(xStart + x1 * c - y1 * s);
              const y2 = round(yStart + x1 * s + y1 * c);

              next = d1.get(x2, y2, 1, 0)//sum > sizesh;
            }
          }

          const bit = next ? 1 : 0;

          d2.set(x, y, next);
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