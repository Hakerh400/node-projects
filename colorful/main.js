'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const ImageData = require('../image-data');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const inputFile = '-dw/1.png';
const outputFile = getOutputFile();

setTimeout(main);

async function main(){
  var img = await media.loadImage(inputFile);

  var pr = new Presentation(w, h, fps, fast);

  pr.render(outputFile, async (w, h, g, g1) => {
    var circumference = O.hypot(w, h) * O.pi;
    var fn = 180//Math.ceil(circumference);
    pr.framesNum = fn;

    var col = Buffer.alloc(3);
    var d = new ImageData(g);

    for(var i = 0; i !== fn; i++){
      d.iterate((x, y) => {
        x -= wh;
        y -= hh;

        var angle;
        if(x === 0 && y === 0) angle = 0;
        else angle = Math.atan2(y, x) + O.pih;

        var k = angle / O.pi2 - i / fn;
        return O.hsv((k % 1 + 1) % 1, col);
      });

      d.put();
      await pr.frame();
    }
  }, exit);
}

function getOutputFile(){
  if(!HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}

function exit(){
  process.exit();
}