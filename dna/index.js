'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const {min, max, floor, sin, cos} = Math;
const {pi, pih} = O;

const params = {
  width: 20,
  height: 1e3,
};

const nucleotides = 'ACGT';

const gen = () => {
  const {width:w, height: h} = params;
  const grid = new O.Grid(w, h, () => ' ');

  const factor = pi / w;
  const wh = w / 2;
  const w1 = w - 1;

  for(let y = 0; y !== h; y++){
    const k = sin(y * factor + pih);

    const x1 = O.bound(floor((k + 1) * wh), 0, w1)
    const x2 = O.bound(floor((1 - k) * wh), 0, w1);
    const n = O.rand(4);

    grid.set(x1, y, nucleotides[n]);
    grid.set(x2, y, nucleotides[3 - n]);

    const start = min(x1, x2) + 1;
    const end = max(x1, x2);

    for(let x = start; x < end; x++)
      grid.set(x, y, '-');
  }

  return grid.d.map(a => a.join('')).join('\n');
};

module.exports = {
  gen,
};