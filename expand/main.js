'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');

const fps = 60;
const fast = !HD;

const inputFile = '-dw/1.png';
const outputFile = getOutputFile();

setTimeout(() => main().catch(log));

async function main(){
  const img = await media.loadImage(inputFile);
  const {canvas} = img;

  const pr = new Presentation(canvas.width, canvas.height, fps, fast);
  pr.verbose = 0;

  const colNew = Buffer.from([0, 255, 0]);
  const col = Buffer.alloc(3);

  await pr.render(outputFile, async (w, h, g, g1) => {
    const [wh, hh] = [w, h].map(a => a >> 1);
    const start = [wh, hh];

    const pixelsNum = w * h;
    var pixelsDone = 0;

    const dImg = new ImageData(img);

    const d = new O.SimpleGrid(w, h, (x, y) => {
      dImg.get(x, y, col);

      var v = Math.round((col[0] + col[1] + col[2]) / 3);
      v = v ** 2 >> 8;

      return v;
    });

    const dPix = new O.SimpleGrid(w, h, () => 0);
    const dg = new ImageData(g);

    dg.iterate((x, y) => {
      var v = d.get(x, y);
      return [v, v, v];
    });

    dg.put();
    await pr.frame();

    dPix.set(...start, 1);
    const queue = [[[...start]]];

    while(queue.length !== 0){
      var elems = queue.shift();
      if(elems.length === 0) continue;

      media.logStatus(pixelsDone + 1, pixelsNum, 'pixel');

      for(var [x, y] of elems){
        dg.set(x, y, colNew);
        pixelsDone++;

        d.adj(x, y, (x, y, v) => {
          if(!d.has(x, y) || dPix.get(x, y)) return;
          dPix.set(x, y, 1);

          var n = O.rand(v);
          while(n >= queue.length)
            queue.push([]);
          queue[n].push([x, y]);
        });
      }

      dg.put();
      await pr.frame();
    }
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}