'use strict';

const HD = 1;

const O = require('../framework');
const media = require('../media');
const ImageData = require('../image-data');
const World = require('./world');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 10;
const framesNum = w * h / 50 + 10 | 0;//duration * fps;

const [wh, hh] = [w, h].map(a => a >> 1);
const [w1, h1] = [w, h].map(a => a - 1);

setTimeout(main);

function main(){
  var imgd, world;

  function init(g){
    imgd = new ImageData(g);
    world = new World();
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1)
      init(g);

    world.draw(imgd);
    world.tick();

    imgd.put();

    return f !== framesNum;
  });
}