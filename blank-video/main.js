'use strict';

const HD = 0;

const O = require('../framework');
const media = require('../media');
const blank = require('.');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 10;
const framesNum = fps * duration;

setTimeout(main);

function main(){
  function init(g){}

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1) init(g);

    return f !== framesNum;
  });
}