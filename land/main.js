'use strict';

const HD = 1;

const O = require('../framework');
const media = require('../media');
const World = require('./world');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60 * 60;
const framesNum = w*h/5**2+fps*3|0//fps * duration;

const scale = HD ? 5 : 20;

const [wh, hh] = [w, h].map(a => a >> 1);
const [w1, h1] = [w, h].map(a => a - 1);

setTimeout(main);

function main(){
  var world;

  function init(g){
    g = new O.EnhancedRenderingContext(g);
    world = new World(w, h, scale, g);

    g.fillStyle = '#000000';
    g.fillRect(0, 0, w, h);
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      init(g);
    }else{
      world.draw();
      world.tick();
    }

    return f !== framesNum;
  });
}