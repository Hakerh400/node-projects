'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const electron = require('electron');
const O = require('../omikron');
const media = require('../media');

const {abs, atan2} = Math;
const {pi4, pih, pi, pi34, pi2} = O;

const SIZE = 175;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 60 * 10;
const framesNum = fps * duration;

const outputFile = getOutputFile();

function main(){
  const ents = [];

  const grid = new O.Grid(w, h, (x, y) => {
    const dist = O.dist(x, y, SIZE, hh);
    const b = dist < SIZE;
    if(!b) return 0;

    const c1 = dist / SIZE;
    const c2 = abs((atan2(y - hh, x - SIZE) / pi2 + .5) * 10 % 2 - 1);
    const col = O.hsv((c1 + c2) / 2);
    const ent = new Entity(x, y, col);
    ents.push(ent);
    return ent;
  });

  const colBg = Buffer.from([0, 0, 0]);
  const dirs = Buffer.alloc(4);
  let d = null;

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      d = new O.ImageData(g);
      d.iter((x, y) => {
        const ent = grid.get(x, y);
        if(ent === 0) return colBg;
        return ent.col;
      });
      d.put();
      return 1;
    }

    for(const ent of O.shuffle(ents)){
      let {x, y, col} = ent;
      let len = 0;
      let dir = -1;

      const force = Math.atan2(y - hh, x - wh) - pih;
      const fdir = ((force - pi4 * .5 + O.randf(pi) - pih) / pi2 % 1 + 1) % 1 * 4 | 0;

      if(grid.get(x, y - 1) === 0){
        dirs[len++] = 0;
        if(fdir === 0) dir = 0;
      }if(grid.get(x + 1, y) === 0){
        dirs[len++] = 1;
        if(fdir === 1) dir = 1;
      }if(grid.get(x, y + 1) === 0){
        dirs[len++] = 2;
        if(fdir === 2) dir = 2;
      }if(grid.get(x - 1, y) === 0){
        dirs[len++] = 3;
        if(fdir === 3) dir = 3;
      }if(len === 0) continue;

      grid.set(x, y, 0);
      d.set(x, y, colBg);

      if(dir === -1)
        dir = dirs[O.rand(len)];

      switch(dir){
        case 0: ent.y = --y; break;
        case 1: ent.x = ++x; break;
        case 2: ent.y = ++y; break;
        case 3: ent.x = --x; break;
      }

      grid.set(x, y, ent);
      d.set(x, y, col);
    }

    d.put();

    return f !== framesNum;
  }, () => O.exit());
}

class Entity{
  constructor(x, y, col){
    this.x = x;
    this.y = y;
    this.col = col;
  }
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}

try{ main(); }
catch(e){ log(e); }