'use strict';

const HD = 1;

var O = require('../framework');
var media = require('../media');
var hash = require('../hash');

const OFFSET = 5;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;
var hd = true;
var duration = HD ? 60 : 10;
var framesNum = fps * duration;

var fontSize = HD ? 20 : 10;
var linesNum = Math.floor(h / fontSize) + 1;
var speed = HD ? 1 : .5;
var hsvFactor = 1;

setTimeout(main);

function main(){
  var num = linesNum;
  var lines = O.ca(linesNum, i => generateLine(i));
  var offset = 0;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';
      g.font = `${fontSize}px arial`;
    }

    g.fillStyle = 'black';
    g.fillRect(0, 0, w, h);

    lines.forEach((line, index) => {
      var hsvVal = num - linesNum + index;
      var scaledVal = hsvVal / linesNum * hsvFactor % 1;
      var col = O.rgb(...O.hsv(scaledVal));

      g.fillStyle = col;
      g.fillText(line, OFFSET, fontSize * index - offset);
    });

    offset += speed;

    if(offset >= fontSize){
      lines.shift();
      lines.push(generateLine(num));

      offset -= fontSize;
      num++;
    }

    return f !== framesNum;
  });
}

function generateLine(i){
  return `${i + 1}`;
}