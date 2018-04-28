'use strict';

var O = require('../framework');
var Presentation = require('../presentation');
var browser = require('../browser');
var buffer = require('../buffer');

var w = 1920;
var h = 1080;
var fps = 60;
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
  var pr = new Presentation(w, h, fps);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    g1.font = '72px arial';

    await pr.caption(O.ca(1e5, () => {
      var c1 = '!'.charCodeAt(0);
      var c2 = '~'.charCodeAt(0);

      //return String.fromCharCode(c1 + O.rand(c2 - c1 + 1));
      return '#';
    }).join(''));

    var str = `${O.ca(1e5, i => i % 5).join('')}`;
    window.emit('_msg', {type: 'import', data: str});

    pressKey('Digit1');
    g1.drawImage(canvas, 0, 0);
    await pr.fade();
    await pr.wait(3e3);

    pressKey('Enter');
    pressKey('Digit1');
    g1.drawImage(canvas, 0, 0);
    await pr.fade();
    await pr.wait(3e3);

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