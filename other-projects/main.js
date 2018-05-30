'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var browser = require('../browser');
var media = require('../media');
var Presentation = require('../presentation');

var url = '/?project=other-projects&sub-project=garden';

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 60;
var framesNum = fps * duration;

var tileSize = 40;
var tileSizeH = tileSize / 2;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f !== 1){
      window.emit('_raf');
    }

    g.drawImage(canvas, 0, 0);

    return f !== framesNum;
  });

  function pressLetter(letter){
    pressKey(`Key${letter.toUpperCase()}`);
  }

  function pressKey(key){
    window.emit('keydown', {code: key});
    window.emit('keyup', {code: key});
  }
}