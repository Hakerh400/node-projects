'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');
const DottedSpace = require('.');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const outputFile = getOutputFile();

setTimeout(() => main().catch(log));

async function main(){
  const pr = new Presentation(w, h, fps, fast);

  const col = Buffer.from([255, 255, 0]);

  await pr.render(outputFile, async (w, h, g, g1) => {
    const ds = new DottedSpace(w, h);
    const d = new ImageData(g);

    O.repeat(1e4, () => {
      var x = O.randf(w);
      var y = O.randf(h);
      ds.add(x, y);
    });

    d.iter((x, y) => {
      d.set(x, y, col);
    });

    d.put();

    await O.repeata(framesNum, async f => {
      f++;

      await pr.frame();
    });
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}