'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const arrOrder = require('../arr-order');

const HD = 0;

const scale = HD ? 5 : 20;
const maxStepsNum = HD ? 2e3 : 100;
const progOffset = 1e5;
const inputOffset = 0;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const outputFile = '-img/1.png';

const main = async () => {
  const scale2 = scale ** 2;
  
  media.renderImage(outputFile, w, h, (w, h, g) => {
    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    const imgd = new O.ImageData(g);
    const col = [0, 0, 0];

    for(let y = 0; y !== h; y++){
      media.logStatus(y + 1, h, 'row');

      for(let x = 0; x !== w; x++){
        const xx = inputOffset + x * scale;
        const yy = progOffset + y * scale;

        let n = 0;
        let m = 0;

        for(let y = 0; y !== scale; y++){
          for(let x = 0; x !== scale; x++){
            const prog = getProg(yy + y);
            const input = getInput(xx + x);
            const steps = getStepsNum(prog, input);
            if(steps === null) continue;

            n++;
            m += steps / maxStepsNum;
          }
        }

        if(n === 0) continue;

        const k = m / n;
        const k1 = 1 - k;
        const r = n / scale2;

        col[0] = 255 * k1 * r + .5 | 0;
        col[1] = 255 * k * r + .5 | 0;

        imgd.set(x, y, col);
      }
    }

    imgd.put();
  }, () => O.exit());
};

const getProg = i => {
  const ps = [];

  i++;

  while(i--){
    let p = '';

    while(1){
      p += i & 1;
      i >>= 1;

      const x = i & 1;
      i >>= 1;

      if(!x) break;
    }

    ps.push(p);
  }

  return ps;
};

const getInput = i => {
  return i.toString(2);
};

const getStepsNum = (prog, input) => {
  let s = input;
  let n = prog.length;
  let m = 0;

  for(let i = 0; i !== maxStepsNum; i++){
    if(s === '') return i + 1;

    const c = s[0];
    s = s.slice(1);
    if(c === '1') s += prog[m];

    if(m === n - 1) m = 0;
    else m++;
  }

  return maxStepsNum;
};

setTimeout(() => main().catch(log));