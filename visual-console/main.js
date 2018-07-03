'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const formatFileName = require('../format-file-name');
const VisualConsole = require('.');

const imgFile = formatFileName('-dw/1.png');
const textFile = formatFileName('-dw/1.js');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const sx = 8;
const sy = 12;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(192, 192, 192),
};

setTimeout(main);

async function main(){
  var img = await getImg(imgFile);
  var text = getText();

  render(img, text);
}

function render(img, str){
  var strLen = str.length;
  var framesNum = strLen + 1;
  var vcon;

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1){
      vcon = new VisualConsole(g, img, sx, sy);

      vcon.setBgCol(cols.bg);
      vcon.setTextCol(cols.text);
    }else{
      vcon.print(str[f - 2]);
    }

    return f !== framesNum;
  });
}

function getText(){
  var str = fs.readFileSync(textFile, 'utf8');

  str = O.sanl(str).map(line => {
    return line.trimRight()
  }).join('\n');

  return str;
}

async function getImg(){
  return await VisualConsole.getCharsImg(imgFile);
}