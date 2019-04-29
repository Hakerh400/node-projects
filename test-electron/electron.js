'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const s = 2e3;
const sh = s / 2;
const shh = s / 4;

const w = s;
const h = s;

setTimeout(main);

function main(){
  media.renderImage('-img/1.png', w, h, (w, h, g) => {
    g.clearRect(0, 0, w, h);

    g.translate(sh, sh);
    g.rotate(1);

    const I = 2e3;
    for (let i = 0; i < I; i++) {
      const color = g.createLinearGradient(-shh, -shh, sh, sh);

      color.addColorStop(0, 'rgba(244, 0, 0, 0.002)');
      color.addColorStop(1, 'rgba(9, 200, 0, 0.002)');
      g.fillStyle = color;

      g.fillRect(-shh, -shh, sh, sh);
    }
  }, () => {
    window.close();
  });
}