'use strict';

throw 0;

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

var speed = 5;
var interval = 180;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  var radius = 100;
  var diameter = radius * 2;

  var xx = O.rand(w - radius);
  var yy = O.rand(h - radius);

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    O.repeat(speed, sp => {
      var ff = (f - 1) * speed + sp;
      var t = ff % interval + 1;

      if(t <= interval - 1){
        if(Math.random() > .1){
          var angle = O.randf(O.pi2);
          var x = xx + Math.cos(angle) * radius;
          var y = yy + Math.sin(angle) * radius;

          var code = 'KeyX';
          var btn = 0;

          var obj = {clientX: x, clientY: y, button: btn};

          if(code !== null) window.emit('keydown', {code});
          window.emit('mousedown', obj);
          window.emit('mouseup', obj);
          if(code !== null) window.emit('keyup', {code});
        }
      }else{
        pressKey('Enter');

        xx = radius + O.randf(w - diameter);
        yy = radius + O.randf(h - diameter);
      }
    });

    pressKey('Digit1');

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