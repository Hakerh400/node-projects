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

const outputFile = getOutputFile(1);

const [wh, hh] = [w, h].map(a => a >> 1);

setTimeout(main);

function main(){
  const n1 = 6;
  const n2 = 23;
  const r = 2;

  const cubs = [];

  O.repeat(n2, z => {
    O.repeat(n1, i => {
      var k1 = i / n1;
      var k2 = (k1 - z / n2) % 1;
      var a = -k2 * O.pi2;

      var x = Math.cos(a) * r;
      var y = Math.sin(a) * r;

      var cub = new Cuboid(x, y, z + .5, 1, 1, 1, k1);
      cubs.push(cub);
    });
  });

  const col = Buffer.alloc(3);

  function init(g){
    const d = new ImageData(g);

    const ray = new Ray();

    d.iterate((x, y) => {
      if(x === 0)
        media.logStatus(y + 1, h, 'row');

      x = (x - wh) / wh;
      y = (y - hh) / wh;

      ray.set_(0, 0, 0);
      ray.vel.set_(x, y, 1);
      ray.vel.setLen(.005);

      while(ray.len() < 30){
        for(var i = 0; i !== cubs.length; i++){
          const cub = cubs[i];

          if(cub.has(ray))
            return cub.paint(ray, col);
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

class Cuboid extends Vector{
  constructor(x, y, z, dx, dy, dz, col){
    var dxh = dx / 2, dyh = dy / 2, dzh = dz / 2;
    super(x + dxh, y + dyh, z + dzh);

    this.v1 = new Vector(x, y, z);
    this.v2 = new Vector(x + dx, y + dy, z + dz);

    this.rad = Math.sqrt(dxh ** 2 + dyh ** 2 + dzh ** 2);
    this.col = col;
  }

  has(v){ return v.gt(this.v1) && v.lt(this.v2); }
  paint(v, col){ return O.hsv((v.dist(this) / this.rad * .9 + this.col) % 1, col); }
};

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}