'use strict';

const fs = require('fs');
const path = require('path');
const {Image} = require('../canvas');
const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const formatFileName = require('../format-file-name');
const BMPParser = require('.');

const scale = 1;

setTimeout(() => main().catch(err));

async function main(){
  var img = await loadImg('-dw/bmp/3.bmp');

  const {width, height} = img;
  log({width, height});

  media.renderImage('-img/1.png', width * scale, height * scale, (w, h, g) => {
    var d = new ImageData(g);

    d.iterate((x, y) => {
      var i = (x / scale | 0) + (y / scale | 0) * (w / scale | 0) << 2;
      return img.data.slice(i, i + 4);
    }, 1);

    d.put();
  });
}

function loadImg(file){
  var buff = fs.readFileSync(formatFileName(file));
  return BMPParser.parse(buff);

  return new Promise((res, rej) => {
    var img = new Image();

    img.onload = () => res(img);
    img.onerror = err => rej(err);

    img.src = buff;
  });
}

function err(err){
  var msg = err instanceof Error ? err.stack : err;
  log(msg);
  process.exit();
}