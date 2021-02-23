'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const HD = 1;

const w = HD ? 1080 : 480;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);
const outputFile = '-dw/1.png';

setTimeout(() => main().catch(log));

async function main(){
  const n = 100;
  const s = w / n;

  media.renderImage(outputFile, w, h, (w, h, g) => {
    g.fillStyle = 'white';
    g.fillRect(0, 0, w, h);

    g.fillStyle = 'black';

    for(let j = 0; j < n; j++){
      const y = j * s;

      for(let i = j & 1; i < n; i += 2){
        const x = i * s;

        g.fillRect(x, y, s, s);
      }
    }
  }, () => {
    O.exit();
  });
}