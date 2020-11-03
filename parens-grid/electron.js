'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const arrOrder = require('../arr-order');

const HD = 0;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const outputFile = '-img/1.png';

const main = async () => {
  media.renderImage(outputFile, w, h, (w, h, g) => {
    const scale = 4;
    const scale2 = scale ** 2;

    const imgd = new O.ImageData(g);
    const col = [0, 0, 0];

    for(let y = 0; y !== h; y++){
      media.logStatus(y + 1, h, 'row');

      for(let x = 0; x !== w; x++){
        const xx = x * scale;
        const yy = y * scale;
        let n = 0;

        for(let y = 0; y !== scale; y++)
          for(let x = 0; x !== scale; x++)
            if(isValid(getExpr(xx + x) + getExpr(yy + y)))
              n++;

        const c = n / scale2 * 255 + .5 | 0;
        col[0] = col[1] = col[2] = c;
        imgd.set(x, y, col);
      }
    }

    imgd.put();
  }, () => O.exit());
};

const getExpr = i => {
  return arrOrder.str('()', BigInt(i));
};

const isValid = e => {
  let d = 0;

  for(const c of e){
    if(c === '('){
      d++;
      continue;
    }

    if(d === 0) return 0;
    d--;
  }

  return d === 0;
};

setTimeout(() => main().catch(log));