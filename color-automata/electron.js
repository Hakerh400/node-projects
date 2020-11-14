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

    // const pat = new Float64Array(O.ca(30, () => O.randf(-1, 1)));
    const pat = new Float64Array([
          0.5581693979794058,  -0.8495879350321509,
          0.7186982778823618,   0.3249216984607046,
         -0.9564455822317206, -0.40825297708869535,
      -0.0057692067357741905,   0.5254769248363136,
          0.5551551534414796,     0.65634556143281,
         -0.5089742710494431, -0.12250242145299728,
        -0.03739733459021943,   0.8454684981808955,
          0.8121520140923191,  -0.9642872667211733,
          -0.625148344210305,  -0.9055413832022277,
         0.49671569137869787, -0.31936028170384656,
         0.14746677355683335, -0.19451197712131396,
          -0.654687917058725,  -0.7512575788424023,
          0.1345666971629904,   0.3614666766206507,
         -0.4325369672176511,   0.3918395831772923,
         -0.6272743146968125,  -0.5313614248929848
    ]);
    log(pat);

    let vec = O.ca(w, x => {
      if(x === wh) return new Float64Array([.1, .1, .1]);
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