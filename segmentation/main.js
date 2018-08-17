'use strict';

const HD = 0;

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const segmentation = require('.');

const EPOCHS = 100;
const SEGS_NUM = 10;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 1 / fps;
const framesNum = fps * duration;

setTimeout(main);

async function main(){
  var img = await media.loadImage('-dw/1.jpeg');
  var col = Buffer.alloc(3);

  function init(g){
    var d = new ImageData(img);
    var seg = new segmentation.Segmentator(SEGS_NUM, 3, 0, 255);

    O.repeat(EPOCHS, () => {
      d.iterate((x, y, r, g, b) => {
        col[0] = r, col[1] = g, col[2] = b;
        seg.update(col);
      });

      seg.epoch();
    });

    seg.round();

    d.iterate((x, y, r, g, b) => {
      col[0] = r, col[1] = g, col[2] = b;
      return seg.closest(col);
    });

    d.put();

    g.drawImage(img.canvas, 0, 0);
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1) init(g);

    media.renderImage('-dw/1.png', w, h, (w, h, g) => {
      g.drawImage(img.canvas, 0, 0);
    });

    return f !== framesNum;
  });
}