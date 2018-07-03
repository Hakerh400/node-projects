'use strict';

const O = require('../framework');
const media = require('../media');
const VisualConsole = require('.');

const imgFile = '-dw/1.png';

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 1;

const duration = 10;
const framesNum = fps * duration;

const sx = 8;
const sy = 12;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(255, 0, 0),
  //text: new O.Color(192, 192, 192),
};

setTimeout(main);

async function main(){
  var chars = await getChars(imgFile);
  render(chars);
}

function render(chars){
  var vcon;

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      vcon = new VisualConsole(g, chars, sx, sy);

      vcon.setBgCol(cols.bg);
      vcon.setTextCol(cols.text);
    }

    var str = O.sanl(`${render}\n\n`).join('\n');
    vcon.print(str[(f - 1) % str.length]);

    return f !== framesNum;
  });
}

async function getChars(){
  return await VisualConsole.getCharsImg(imgFile);
}