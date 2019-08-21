'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const FACTOR = 0.6193;
const ITERS_MIN = 100;
const ITERS_MAX = 1e4;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const [wh, hh] = [w, h].map(a => a >> 1);

const maxInt = Number.MAX_SAFE_INTEGER;
const itersNum = (ITERS_MAX - ITERS_MIN) * 2;
const scale = 1e-3;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    const d = new O.ImageData(g);
    const col = Buffer.alloc(3);

    d.iter((x, y) => {
      if(x === 0) media.logStatus(y + 1, h, 'row');

      const k = calc(x * scale, y * scale);
      return O.hsv(k, col);
    });

    d.put();
  }, () => O.exit());
}

function calc(x, y){
  for(let i = 0; i !== ITERS_MAX; i++){
    const xx = xor(x, y);
    const yy = (x + y) * FACTOR;
    x = xx;
    y = yy;

    if(i > ITERS_MIN){
      const ax = Math.abs(x);
      if(ax < 1e-6) return i / itersNum;
      if(ax > 1e6) return 1 - i / itersNum;
    }
  };

  return .5;
}

function xor(a, b){
  const s1 = a < 0;
  const s2 = b < 0;

  a = Math.abs(a);
  b = Math.abs(b);

  let n = 0;
  let x = 1;
  let y = 2;

  while(y < maxInt){
    const c1 = a / x & 1;
    const c2 = b / x & 1;
    const c3 = a * y & 1;
    const c4 = b * y & 1;

    n += (c1 ^ c2) * x + (c3 ^ c4) / y;
    x = y;
    y *= 2;
  }

  return s1 === s2 ? n : -n;
}