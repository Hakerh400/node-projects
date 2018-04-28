'use strict';

var O = require('../framework');
var media = require('../media');
var browser = require('../browser');

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 10;
var framesNum = fps * duration;

var game = 'netwalk';
var url = `/?project=games&game=${game}`;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);
  window.on('_ready', () => render(window));
}

function render(window){
  var canvas = window._canvases[0];

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f !== 1){
      var key = `Arrow${O.randElem(['Up', 'Left', 'Down', 'Right'])}`;
      window.emit('keydown', {code: key});
      window.emit('keyup', {code: key});
    }

    g.drawImage(canvas, 0, 0);

    return f !== framesNum;
  });
}