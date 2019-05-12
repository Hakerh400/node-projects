'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const Presentation = require('../presentation');
const BT = require('../bitwise-trance');

const entsNum = 1e4;
const bufLen = 1e3;
const speed = 100;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);
const [w1, h1] = [w, h].map(a => a - 1);

const duration = 60 * 10;
const framesNum = fps * duration;

const outputFile = getOutputFile();

setTimeout(() => main().catch(log));

async function main(){
  const ents = O.ca(entsNum, (i, k) => {
    const src = O.randBuf(bufLen);
    const col = O.Color.from(O.hsv(k));

    return new Entity(src, wh, hh, col);
  });

  const pr = new Presentation(w, h, fps, fast);
  pr.framesNum = framesNum;

  await pr.render(outputFile, async (w, h, g, g1) => {
    await O.repeata(framesNum, async () => {
      await pr.frame();

      g.fillStyle = 'black';
      g.fillRect(0, 0, w, h);

      await O.repeata(speed, async () => {
        for(const ent of ents)
          await ent.tick();
      });

      for(const ent of ents)
        ent.draw(g);
    });
  });
}

class Entity{
  constructor(src, x, y, col){
    this.x = x;
    this.y = y;
    this.col = col;

    this.eng = new BT.Engine(src);
    this.eng.on('read', this.onRead.bind(this));
    this.eng.on('write', this.onWrite.bind(this));

    this.moves = 0;
    this.collisions = 0;
    this.ticksAfterLastMove = 0;

    this.bb = new BT.BitBuffer();
    this.bi = 0;

    this.gen = this.generator();
    this.gen.next();
  }

  async tick(){
    await this.eng.tick();

    if(this.ticksAfterLastMove++ === 1e4)
      this.reset();
  }

  draw(g){
    g.fillStyle = this.col;
    g.beginPath();
    g.arc(this.x, this.y, 1.5, 0, O.pi2);
    g.fill();
  }

  reset(){
    this.x = wh;
    this.y = hh;

    this.eng = new BT.Engine(O.randBuf(bufLen));
    this.eng.on('read', this.onRead.bind(this));
    this.eng.on('write', this.onWrite.bind(this));

    this.moves = 0;
    this.collisions = 0;
    this.ticksAfterLastMove = 0;
  }

  *generator(){
    const {bb} = this;

    while(1){
      const {x, y} = this;
      const dir = (yield 0) | ((yield 0) << 1);

      switch(dir){
        case 0: this.y !== 0 && this.y--; break;
        case 1: this.x !== w1 && this.x++; break;
        case 2: this.y !== h1 && this.y++; break;
        case 3: this.x !== 0 && this.x--; break;
      }

      let bi = 0;
      const collision = this.x === x && this.y === y;
      bb.set(bi++, !collision);

      this.ticksAfterLastMove = 0;

      this.moves++;
      if(collision) this.collisions++;
      if(this.collisions > this.moves * .05)
        this.reset();

      this.bi = 0;
    }
  }

  onRead(cb){
    cb(this.bb.get(this.bi++));
  }

  onWrite(bit){
    this.gen.next(bit);
  }
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  const project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}