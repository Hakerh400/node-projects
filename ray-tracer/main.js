'use strict';

const HD = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const Ray = require('./ray');
const Vector = require('./vector');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60;
const framesNum = fps * duration;

const outputFile = getOutputFile();

const [wh, hh] = [w, h].map(a => a >> 1);

const v = new Vector(0, 0, 0);

setTimeout(main);

function main(){
  const n1 = 6;
  const n2 = 23;
  const r = 2;

  const cubes = [];

  O.repeat(n2, z => {
    O.repeat(n1, i => {
      var k1 = i / n1;
      var k2 = (k1 - z / n2) % 1;
      var a = -k2 * O.pi2;

      var x = Math.cos(a) * r;
      var y = Math.sin(a) * r;

      var cube = new Cube(x, y, z, 1, 0, z / n2 * O.pi2, 0, k1);
      cubes.push(cube);
    });
  });

  const col = Buffer.alloc(3);

  function init(g){
    const d = new ImageData(g);

    const ray = new Ray(0, 0, 0);

    d.iterate((x, y) => {
      if(x === 0)
        media.logStatus(y + 1, h, 'row');

      x = (x - wh) / wh;
      y = (y - hh) / wh;

      ray.set_(0, 0, 0);
      ray.vel.set_(x, y, 1);
      ray.vel.setLen(.005);

      while(ray.len() < 30){
        for(var i = 0; i !== cubes.length; i++){
          const cube = cubes[i];

          if(cube.has(ray))
            return cube.paint(ray, col);
        }

        ray.move();
      }
    });

    d.put();
  }

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1) init(g);

    return f !== framesNum;
  });
}

class Cube extends Vector{
  constructor(x, y, z, size, rx, ry, rz, col){
    super(x, y, z);

    this.size = size;
    this.sizeH = size / 2;

    this.rad = size / 1.5 ** .5;
    this.rot = new Vector(rx, ry, rz);

    this.col = col;
  }

  has(vv){
    const s = this.sizeH;
    v.set(vv).sub(this).rotn(this.rot);
    return v.gt_(-s, -s, -s) && v.lt_(s, s, s);
  }

  paint(v, col){
    return O.hsv((v.dist(this) / this.rad * .9 + this.col) % 1, col);
  }
};

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}