'use strict';

var O = require('../framework');
var media = require('../media');
var browser = require('../browser');
var logStatus = require('../log-status');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60 * 10;
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

  var size = 200;
  var xx = O.rand(w - size);
  var yy = O.rand(h - size);

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    g.drawImage(canvas, 0, 0);

    var t = (f - 1) % (fps * 3) + 1;

    if(t <= 179){
      if(Math.random() > .1){
        window.emit('mousedown', {button: [0, 2][O.rand(2)], clientX: randX(), clientY: randY()});
      }else{
        window.emit('mousemove', {clientX: randX(), clientY: randY()});
        window.emit('keydown', {code: `Key${'WBX'[O.rand(3)]}`});
      }
    }else{
      xx = O.rand(w - size);
      yy = O.rand(h - size);

      window.emit('keydown', {code: 'Enter'});
    }

    return f != framesNum;
  });

  function randX(){
    return xx + O.rand(200);
  }

  function randY(){
    return yy + O.rand(200);
  }
}