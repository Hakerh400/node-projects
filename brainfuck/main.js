'use strict';

var fs = require('fs');
var O = require('../framework');
var media = require('../media');
var browser = require('../browser');
var logStatus = require('../log-status');
var brainfuck = require('.');

var w = 640;
var h = 480;
var fps = 60;
var hd = true;

var srcFile = 'src.txt';

setTimeout(main);

function main(){
  var src = fs.readFileSync(srcFile).toString();
  var prog = brainfuck.compile(src, '');

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f);

    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';
      g.font = '32px arial';
    }

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    g.fillStyle = 'white';
    g.fillText(Object.getOwnPropertyNames(prog.mem).length, 5, 5);

    O.repeat(1e3, () => prog.tick());

    return !prog.finished;
  });
}