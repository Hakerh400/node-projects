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

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      var str = '';
      window.emit('_msg', {type: 'import', data: str});

      pressKey('Digit1');
      g.drawImage(canvas, 0, 0);
    }else if(f % fps === 1){
      var evt = {type: 'export'};
      window.emit('_msg', evt);

      evt.type = 'import';
      evt.data = evt.data.match(/\S{2}/g).map(a => (parseInt(a) & 1).toString(16).padStart(2, '0')).join``;
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