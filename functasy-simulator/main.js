'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const Entity = require('./entity');

const ENTS_NUM = 1e4;
const TICKS_PER_FRAME = 100;

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const [wh, hh] = [w, h].map(a => a >> 1);

const duration = 10;
const framesNum = fps * duration;

const outputFile = getOutputFile(1);

setTimeout(main);

function main(){
  const ents = O.ca(ENTS_NUM, i => {
    var src = randSrc();

    var x = wh;
    var y = hh;
    var col = O.Color.from(O.hsv(i / ENTS_NUM));

    return new Entity(src, w, h, x, y, col);
  });

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    for(var ent of ents) ent.draw(g);
    for(var ent of ents) ent.tick(TICKS_PER_FRAME);

    return f !== framesNum;
  });
}

function randSrc(){
  const minLen = 100;
  var src = '';

  while(src.length < minLen){
    try{ src += func(0); }
    catch{}
  }

  return src;

  function func(depth){
    var s = '';

    while(O.rand(2) === 1){
      if(depth !== 0 && O.rand(2) === 0){
        s += toName(O.rand(depth), depth);
      }else{
        s += func(depth + 1);
      }
    }

    return `(${s})`;
  }
}

function toName(id, depth=id + 1){
  var ident = '';

  for(var d = depth; d !== 0; d = d / 62 | 0){
    var n = id % 62;
    id = id / 62 | 0;

    var c = n < 10 ? O.sfcc(O.cc('0') + n) :
            n < 36 ? O.sfcc(O.cc('a') + n - 10) :
            O.sfcc(O.cc('0') + n - 36);

    ident = c + ident;
  }

  return ident;
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}