'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const {min, max, abs, floor, sin, cos} = Math;
const {pi, pih} = O;

const LIGHT = 0;
const CORRELATION = 0;

const params = {
  width: 20,
  height: 1e3,
};

const nucleotides = 'ACGT';

const gen = () => {
  const {width: w, height: h} = params;
  const grid = new O.Grid(w, h, () => ' ');

  const factor = pi / w;
  const wh = w / 2;
  const w1 = w - 1;

  for(let y = 0; y !== h; y++){
    const k = sin(y * factor + pih);

    const x1 = O.bound(floor((1 - k) * wh), 0, w1)
    const x2 = O.bound(floor((k + 1) * wh), 0, w1);
    const mode = x1 < x2;

    const n1 = O.rand(4);
    const n2 = CORRELATION ? 3 - n : O.rand(4);

    grid.set(x1, y, nucleotides[n1]);
    grid.set(x2, y, nucleotides[n2]);

    const xMin = mode ? x1 : x2;
    const xMax = mode ? x2 : x1;

    const lightBase = (sin(y * factor) * (mode ? -1 : 1) + 1) / 2;

    for(let x = xMin + 1; x < xMax; x++){
      const light = lightBase + (x - xMin) ** .5 / w + O.randf(.2);
      const lightChar = LIGHT ? '=-.'[O.bound(floor(light * 3), 0, 2)] : '-';
      grid.set(x, y, lightChar);
    }
  }

  return grid.d.map(a => a.join('').trimRight()).join('\n');
};

module.exports = {
  gen,
};