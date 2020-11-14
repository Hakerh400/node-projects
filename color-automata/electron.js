'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const {min, max, abs} = Math;

const HD = 1;

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
    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    const imgd = new O.ImageData(g);
    const bg = new Float64Array([0, 0, 0]);
    const col = new Uint8ClampedArray([0, 0, 0]);
    const cc = [bg, bg, bg];

    const pat = new Float64Array(
      1 ? [
          0.45601801131337316,    0.9531767275209555,
         0.057285971046328044,     0.937629347028972,
         0.009606836756303583,   -0.3822257014182906,
          0.42679702540360687,  -0.25596388563785233,
         -0.15278922959702745, -0.009874986537292685,
         -0.17166937068497967,    0.5171050639278789,
           0.6088980192099842,   -0.8021418838059646,
           0.1778824947815023,   -0.6968549104840056,
        -0.010477827274851137,    0.6087724171000244,
          -0.7820931294666247,   -0.3538514331574669,
          -0.3539573886627805,   0.39986555573594673,
          0.19090949924619238,  -0.42334332824059384,
           0.7420637750610823,    0.6634364760217286,
          -0.8487803700422552,    0.7458052865939826,
          -0.5189740790537805,   -0.7599592242728006,
      ] : O.ca(30, () => O.randf(-1, 1))  
    );
    log(pat);

    let vec = O.ca(w, x => {
      // return new Float64Array(O.ca(3, () => O.randf(-1, 1)));
      if(x === wh) return new Float64Array([0, 1, 1]);
      return bg;
    });

    const set = (x, y, cf) => {
      for(let i = 0; i !== 3; i++)
        col[i] = (cf[i] + 1) / 2 * 255 + .5 | 0;

      imgd.set(x, y, col);
    };

    for(let x = 0; x !== w; x++)
      set(x, 0, vec[x]);

    for(let y = 1; y !== h; y++){
      const n = vec.length;
      const vec1 = [];

      for(let i = -1; i <= n; i++){
        for(let j = 0; j !== 3; j++){
          const k = i + j - 1;
          cc[j] = vec[O.bound(k, 0, n - 1)];
        }

        const cf = new Float64Array(3);

        for(let colIndex = 0; colIndex !== 3; colIndex++){
          const p = colIndex * 10;
          let c = pat[p + 9];

          for(let ccIndex = 0; ccIndex !== 3; ccIndex++)
            for(let j = 0; j !== 3; j++)
              c += cc[ccIndex][j] * pat[p + ccIndex * 3 + j];

          cf[colIndex] = O.bound(c, -1, 1);
        }

        vec1.push(cf);

        const x = i - y;

        if(x >= 0 && x < w)
          set(x, y, cf);
      }

      vec = vec1;
    }

    imgd.put();
  }, () => O.exit());
};

setTimeout(() => main().catch(log));