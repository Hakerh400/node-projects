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

var speed = 5;
var interval = 180;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.on('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  var size = 100;
  var xx = O.rand(w - size);
  var yy = O.rand(h - size);

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    O.repeat(speed, sp => {
      var ff = (f - 1) * speed + sp;
      var t = ff % interval + 1;

      if(t <= interval - 1){
        if(Math.random() > .1){
          var angle = O.randf(O.pi2);
          var x = xx + Math.cos(angle) * size;
          var y = yy + Math.sin(angle) * size;

          var btn = 0;//[0, 2][O.rand(2)];
          var obj = {clientX: x, clientY: y, button: btn};

          var type = O.rand(5);
          var code = 'KeyV';//[null, 'KeyB', 'KeyW', 'KeyX', 'KeyV'][type];

          if(type !== 0) window.emit('keydown', {code});
          window.emit('mousedown', obj);
          window.emit('mouseup', obj);
          if(type !== 0) window.emit('keyup', {code});
        }
      }else{
        pressKey('Enter');

        xx = O.rand(w - size);
        yy = O.rand(h - size);
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