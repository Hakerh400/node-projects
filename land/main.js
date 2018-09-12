'use strict';

const HD = 1;

const O = require('../framework');
const media = require('../media');
const browser = require('../browser');

const url = '/?project=land';

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const duration = 60 * 60 * 5;
const framesNum = fps * duration;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.on('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    g.drawImage(canvas, 0, 0);
    window.emit('_raf');

    return f !== framesNum;
  });
}