'use strict';

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const media = require('../media');

const SPACE_SIZE = 200;
const OFFSET = 20;

const cols = {
  bg: '#fff',
  arrow: '#0f0',
};

const images = [
  '-dw/1.png',
  '-dw/2.png',
];

const outputFile = '-dw/output.png';

setTimeout(() => main().catch(log));

async function main(){
  const imgs = [];

  for(const file of images)
    imgs.push((await media.loadImage(file)).canvas);

  const w = imgs.reduce((w, img) => w + img.width, 0) + SPACE_SIZE * (imgs.length - 1) + OFFSET * 2;
  const h = Math.max(imgs.reduce((h, img) => Math.max(h, img.height), 0) + OFFSET * 2, SPACE_SIZE);
  const [wh, hh] = [w, h].map(a => a / 2);

  media.renderImage(outputFile, w, h, (w, h, g) => {
    g.fillStyle = cols.bg;
    g.fillRect(0, 0, w, h);

    imgs.reduce((x, img, i) => {
      g.drawImage(img, x, h - img.height >> 1);

      if(i !== imgs.length - 1){
        g.translate(x + img.width + SPACE_SIZE / 2, hh);
        g.scale(SPACE_SIZE, SPACE_SIZE);
        g.lineWidth = 2 / SPACE_SIZE;
        g.translate(-.5, -.5);

        g.beginPath();
        g.moveTo(.1, .4);
        g.lineTo(.6, .4);
        g.lineTo(.6, .25);
        g.lineTo(.9, .5);
        g.lineTo(.6, .75);
        g.lineTo(.6, .6);
        g.lineTo(.1, .6);
        g.closePath();

        g.fillStyle = cols.arrow;
        g.fill();
        g.stroke();

        g.resetTransform();
        g.lineWidth = 1;
      }

      return x + img.width + SPACE_SIZE;
    }, OFFSET);
  }, () => O.exit());
}