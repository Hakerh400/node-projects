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

  var radius = 100;
  var diameter = radius * 2;

  var xx = radius + O.randf(w - diameter);
  var yy = radius + O.randf(h - diameter);

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      var str =
      '0888888888888888888888888888888888888888888888888924924924924924' +
      '9249249249249249249244924924924924924924924924924924924922492492' +
      '4924924924924924924924924924912492492492492492492492492492492492' +
      '4892492492492492492492492492492492492449249249249249249249249249' +
      '2492492492249249249249249249249249249249249249124924924924924924' +
      '9249249249249249248924924924924924924924924924924924924492492492' +
      '4924924924924924924924924922492492492492492492492492492492492491' +
      '2492492492492492492492492492492492489249249249249249249249249249' +
      '2492492449249249249249249249249249249249249224924924924924924924' +
      '9249249249249249124924924924924924924924924924924924892492492492' +
      '4924924924924924924924924492492492492492492492492492492492492249' +
      '2492492492492492492492492492492491249249249249249249249249249249' +
      '2492489249249249249249249249249249249249244924924924924924924924' +
      '9249249249249224924924924924924924924924924924924912492492492492' +
      '4924924924924924924924892492492492492492492492492492492492449249' +
      '24924924924924924924924924924920';

      window.emit('_msg', {type: 'import', data: str});

      pressKey('Digit1');
      g.drawImage(canvas, 0, 0);
    }else if(f % fps === 1){
      var evt = {type: 'export'};
      window.emit('_msg', evt);

      evt.type = 'import';
      evt.data = `0${evt.data}`;
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