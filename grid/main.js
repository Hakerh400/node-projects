'use strict';

var O = require('../framework');
var media = require('../media');
var Canvas = require('../media/node_modules/canvas');
var browser = require('../browser');
var logStatus = require('../log-status');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 3;
var framesNum = fps * duration;

var url = '/?project=grid';

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.on('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  window.emit('keydown', {code: 'KeyG'});

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    g.drawImage(canvas, 0, 0);

    window.emit('keydown', {code: `Arrow${'Up,Left,Down,Right'.split`,`[O.rand(4)]}`});

    return f != framesNum;
  });
}