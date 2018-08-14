'use strict';

const HD = 0;

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const Sequence = require('../sequence');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 1 / fps;
const framesNum = fps * duration;

setTimeout(main);

async function main(){
  var img = await loadImg();
  render(img);
}

function loadImg(){
  return new Promise(res => {
    var img;

    media.editImage('-dw/1.png', '-', (w, h, g) => {
      img = g.canvas;
    }, () => {
      res(img);
    });
  });
}

function render(img){
  var gImg = media.createContext(w, h);
  gImg.drawImage(img, 0, 0);

  var dImg = new ImageData(gImg);
  var d;

  var col = Buffer.alloc(3);
  var col1 = Buffer.alloc(3);
  var col2 = Buffer.alloc(3);

  var seq = new Sequence(20);

  dImg.iterate((x, y, r, g, b) => {
    approxRgb(r, g, b, 30, col);
    seq.add(col.toString('hex'));
  });

  seq.finalize();

  function init(g){
    d = new ImageData(g);

    var sampler = seq.createSampler();

    d.iterate((x, y) => {
      var next = sampler.next();

      if(next.done){
        sampler = seq.createSampler();
        next = sampler.next();
      }

      var val = next.value;

      return Buffer.from(val, 'hex');
    });

    d.put();
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1)
      init(g);

    return f !== framesNum;
  });
}

function approxCol(col1, k, col){
  col[0] = approx(col1[0], 255, k);
  col[1] = approx(col1[1], 255, k);
  col[2] = approx(col1[2], 255, k);

  return col;
}

function approxRgb(r, g, b, k, col){
  col[0] = approx(r, 255, k);
  col[1] = approx(g, 255, k);
  col[2] = approx(b, 255, k);

  return col;
}

function approx(val, scale, k){
  val /= scale;

  k--;
  val = Math.round(val * k) / k;

  return Math.round(val * scale);
}

function intpCol(col1, col2, k2, col){
  var k1 = 1 - k2;

  col[0] = Math.round(col1[0] * k1 + col2[0] * k2);
  col[1] = Math.round(col1[1] * k1 + col2[1] * k2);
  col[2] = Math.round(col1[2] * k1 + col2[2] * k2);

  return col;
}