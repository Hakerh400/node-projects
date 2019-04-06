'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const ImageData = require('../image-data');
const Rectangle = require('./rectangle');
const corners = require('./corners');

const w = 1920;
const h = 1080;

const [wh, hh] = [w, h].map(a => a >> 1);
const [w1, h1] = [w, h].map(a => a - 1);

const outputFile = '-img/1.png';

setTimeout(main);

function main(){
  const rects = [];

  {
    const height = h;

    for(const corner of corners){
      const [[a, b], [c, d], [e, f], [g, h]] = corner.map(coords => {
        if(coords === null) return [0, 0];
        return coords;
      });

      rects.push(new Rectangle(0, 0, a, b));
      rects.push(new Rectangle(w - c, 0, c, d));
      rects.push(new Rectangle(0, height - f, e, f));
      rects.push(new Rectangle(w - g, height - h, g, h));
    }
  }

  const cnt = (x, y) => {
    return rects.reduce((num, rect) => {
      if(rect.has(x, y)) return num + 1;
      return num;
    }, 0);
  };


  const max = Math.max(cnt(0, 0), cnt(w1, 0), cnt(0, h1), cnt(w1, h1));
  const col = Buffer.alloc(3);

  media.renderImage(outputFile, w, h, (w, h, g) => {
    const d = new ImageData(g);

    d.iter((x, y) => {
      const num = cnt(x, y);
      const k = (1 - num / max) / 2;
      return O.hsv(k, col);
    });

    d.put();
  }, () => {
    window.close();
  });
}