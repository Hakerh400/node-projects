'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const cs = require('C:/Projects/esolangs/src/langs/exotic/ctors');
const media = require('../media');
const format = require('../format');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const main = () => {
  const outputFile = format.path('-img/1.png');

  media.renderImage(outputFile, w, h, (w, h, g, f) => {
    const imgd = new O.ImageData(g);
    const col = Buffer.alloc(3);

    for(let yy = 0; yy !== h; yy++){
      media.logStatus(yy + 1, h, 'row');

      for(let xx = 0; xx !== w; xx++){
        const x = BigInt(xx);
        const y = BigInt(yy);
        const h = BigInt(O.hypot(xx, yy) + .5 | 0);

        const fst = cs.Expression.fromInt(x);
        const snd = cs.Expression.fromInt(y);
        const pair1 = new cs.Pair(new cs.Pair(cs.Term.term, fst), snd);
        const pair2 = new cs.Pair(snd, new cs.Pair(cs.Term.term, fst));
        const n1 = pair1.toInt() - pair2.toInt();
        const n2 = h ** 3n;

        const k1 = .5;
        const k2 = 1 - k1;

        col[0] = calc(n1) * k1 + calc(n2) * k2;
        col[1] = calc(n1 >> 9n) * k1 + calc(n2 >> 9n) * k2;
        col[2] = calc(n1 >> 18n) * k1 + calc(n2 >> 18n) * k2;

        imgd.set(xx, yy, col);
      }
    }

    imgd.put();
  }, () => exit());
};

const calc = n => {
  n = (n & 511n) - 256n;
  if(n < 0n) n = -n;
  if(n > 255n) n = 255n;
  return Number(255n - n);
};

const exit = () => {
  setInterval(() => O.exit(), 16);
};

main();