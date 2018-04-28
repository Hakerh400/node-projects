'use strict';

var O = require('../framework');
var media = require('../media');
var browser = require('../browser');

var game = 'sokoban';
var url = `/?project=games&game=${game}`;

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 10;
var framesNum = fps * duration;

var interval = 0;
var fInterval = Math.max(Math.round(interval / 1e3 * 60), 1);

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);
  window.on('_ready', () => render(window));
}

function render(window){
  var canvas = window._canvases[0];

  var moves = getMoves();
  var index = 0;

  media.renderVideo('-vid/1.mp4', w, h, fps, (w, h, g, f) => {
    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';
      g.font = '32px arial';
    }

    if((f - 1) % fInterval === 0){
      if(f !== 1){
        if(index === moves.length)
          return 0;

        media.logStatus(index + 1, moves.length, 'move');

        var key = `Arrow${['Up', 'Left', 'Down', 'Right'][moves[index++]]}`;
        var evt = {code: key};
        window.emit('keydown', evt);
        window.emit('keyup', evt);
      }

      g.drawImage(canvas, 0, 0);
    }

    return 1;
  });
}

function getMoves(){
  var moves = 'F3,F12,F3,F3,F3,F3,F3,F3,F3,F3,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowUp,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,F3,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowUp,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowLeft,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowDown,ArrowLeft,F3,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowUp,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowLeft,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,F3,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowUp,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowLeft,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowUp,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowRight,ArrowRight,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowLeft,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowRight,ArrowUp,ArrowLeft,ArrowDown,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowRight,ArrowDown,ArrowUp,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowDown,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowRight,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowLeft,ArrowDown,ArrowDown,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowDown,ArrowLeft,ArrowUp,ArrowLeft,ArrowDown,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowLeft,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowRight,ArrowDown,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowLeft,ArrowUp,ArrowLeft,ArrowDown,ArrowRight,ArrowUp,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowRight,ArrowDown,ArrowDown,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowUp,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowRight,ArrowDown,ArrowRight,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowDown,ArrowDown,ArrowUp,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowLeft,ArrowRight,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowLeft,ArrowDown,ArrowLeft,ArrowDown,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowDown,ArrowRight,ArrowRight,ArrowUp,ArrowUp,ArrowLeft,ArrowUp,ArrowUp,ArrowUp,ArrowUp,ArrowRight,ArrowRight,ArrowDown,ArrowDown,ArrowDown,ArrowRight,ArrowDown,ArrowLeft,ArrowLeft,ArrowRight,ArrowUp,ArrowUp,ArrowUp,ArrowUp,ArrowDown,ArrowLeft,ArrowUp,ArrowLeft,ArrowLeft,ArrowLeft,ArrowLeft,ArrowDown,ArrowDown,ArrowRight,ArrowUp,ArrowLeft,ArrowUp,ArrowRight,ArrowRight,ArrowRight,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowDown,ArrowDown,ArrowDown,ArrowDown,ArrowLeft,ArrowDown,ArrowDown,ArrowLeft,ArrowLeft,ArrowUp,ArrowRight,ArrowDown,ArrowRight,ArrowUp,Escape,Escape,ShiftLeft,ControlLeft,KeyJ'.
    split(',');

  moves = moves.
    slice(moves.length - [...moves].reverse().findIndex(a => {
      return /^f3$/i.test(a);
    }) - 1).
    filter(a => /arrow/i.test(a)).
    map(a => {
      return ['up', 'left', 'down', 'right'].
        findIndex(b => a.toLowerCase().includes(b));
    });

  moves.splice(351, 2);

  return moves;
}