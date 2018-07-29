'use strict';

const HD = 0;

const O = require('../framework');
const media = require('../media');
const World = require('./world');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60;
const framesNum = fps * duration;

const scale = HD ? 40 : 20;

const [wh, hh] = [w, h].map(a => a >> 1);
const [w1, h1] = [w, h].map(a => a - 1);

setTimeout(main);

function main(){
  var world;

  function init(g){
    g = new O.EnhancedRenderingContext(g);
    world = new World(w, h, scale, g);
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1)
      init(g);

    world.draw();
    world.tick();

    return f !== framesNum;
  });
}