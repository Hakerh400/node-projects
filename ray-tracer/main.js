'use strict';

const HD = 0;

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');
const browser = require('../browser');

const URL = '/?project=ray-tracer';

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60 * 60;
const framesNum = fps * duration;

const outputFile = getOutputFile();

setTimeout(main);

function main(){
  const window = new browser.Window(w, h, URL);

  window.on('_ready', () => {
    render(window);
  });
}

function render(window){
  const canvas = window._canvases[0];
  const buf = Buffer.alloc(w * h << 2);
  buf.fill(255);

  const {width: cw, height: ch} = canvas;

  var evt = {type: 'setBuff', buf};
  window.emit('_msg', evt);

  var evt = {code: 'KeyW'};
  window.emit('keydown', evt);

  media.renderVideo(outputFile, w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);
    if(f === framesNum) return -1;

    window.emit('_raf');
    return buf;
  });
}

function getOutputFile(vid=0){
  if(vid || !HD) return '-vid/1.mp4';
  var project = path.parse(__dirname).name;
  return `-render/${project}.mp4`;
}