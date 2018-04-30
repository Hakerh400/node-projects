'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var browser = require('../browser');
var media = require('../media');
var Presentation = require('../presentation');

var url = '/?project=grid-projects&sub-project=arrows';

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 10;
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
  var pr = new Presentation(w, h, fps);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    g1.drawImage(canvas, 0, 0);
    await pr.fade();

    var msgEvt = {
      type: 'sample',
      data: null,
    };

    var mouseEvt = {
      button: 0,
      clientX: null,
      clientY: null,
    };

    while(1){
      window.emit('_msg', msgEvt);
      if(msgEvt.data === null)
        break;

      var x = msgEvt.data[0] * tileSize + tileSizeH;
      var y = msgEvt.data[1] * tileSize + tileSizeH;

      g1.globalAlpha = .5;
      g1.fillStyle = 'red';
      g1.beginPath();
      g1.arc(x, y, tileSizeH, 0, O.pi2);
      g1.fill();
      g1.globalAlpha = 1;
      await pr.fade();
      await pr.wait();

      mouseEvt.clientX = x;
      mouseEvt.clientY = y;
      window.emit('mousedown', mouseEvt);

      g1.drawImage(canvas, 0, 0);
      await pr.fade();
    }

    await pr.fadeOut();
  });

  function pressLetter(letter){
    pressKey(`Key${letter.toUpperCase()}`);
  }

  function pressKey(key){
    window.emit('keydown', {code: key});
    window.emit('keyup', {code: key});
  }
}