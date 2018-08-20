'use strict';

const O = require('../framework');
const media = require('../media');
const Segmentator = require('.');

const COLS_NUM = 10;
const EPOCHS_NUM = 100;

setTimeout(main);

async function main(){
  var img = await media.loadImage('-dw/1.jpeg');
  var {width: w, height: h} = img.canvas;

  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    Segmentator.img(img, COLS_NUM, EPOCHS_NUM);
    g.drawImage(img.canvas, 0, 0);
  });
}