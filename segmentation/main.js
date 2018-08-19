'use strict';

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const segmentation = require('.');

const EPOCHS = 100;
const SEGS_NUM = 10;

setTimeout(main);

async function main(){
  var img = await media.loadImage('-dw/1.jpeg');
  var col = Buffer.alloc(3);

  var {width: w, height: h} = img.canvas;

  media.renderImage('-dw/1.png', w, h, (w, h, g) => {
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
  });
}