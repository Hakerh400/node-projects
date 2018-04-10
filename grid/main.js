'use strict';

var O = require('../framework');
var media = require('../media');
var browser = require('../browser');
var buffer = require('../buffer');
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

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      var arr = [];
      var str = Buffer.from(arr).toString('hex');
      window.emit('_msg', {type: 'import', data: str});

      pressKey('Digit1');
      g.drawImage(canvas, 0, 0);
    }else if(f % fps === 1){
      var evt = {type: 'export'};
      window.emit('_msg', evt);

      evt.type = 'import';
      var arr = [...buffer.fromHex(evt.data)];

      arr = arr.map((a, b) => {
        if(b !== 0) return a;
        return ~a;
      });

      evt.data = Buffer.from(arr).toString('hex');
      window.emit('_msg', evt);
      pressKey('Enter');

      pressKey('Digit1');
      g.drawImage(canvas, 0, 0);
    }

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