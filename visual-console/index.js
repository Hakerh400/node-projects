'use strict';

const O = require('../framework');
const media = require('../media');

const CHAR_CODE_FIRST = O.cc(' ');
const CHAR_CODE_LAST = O.cc('~');

class VisualConsole{
  constructor(g, img, sx, sy, bgCol='#000000', textCol='#ffffff'){
    var canvas = g.canvas;

    this.canvas = canvas;
    this.g = g;

    this.w = canvas.width;
    this.h = canvas.height;

    this.img = img;

    this.sx = sx;
    this.sy = sy;

    this.ws = this.w / sx | 0;
    this.hs = this.h / sy | 0;

    this.bgCol = bgCol;
    this.textCol = textCol;

    this.x = 0;
    this.y = 0;
  }

  static async getCharsImg(img){
    if(typeof img === 'string')
      img = await getImg(img);

    return img;
  }

  setBgCol(col){
    this.bgCol = col;
  }

  setTextCol(col){
    this.textCol = col;
  }

  print(str){
    String(str).split('').forEach(char => {
      this.printChar(char);
    });
  }

  printChar(char){
    if(char === '\n'){
      this.newLine();
      return;
    }

    var cc = O.cc(char);

    if(cc < CHAR_CODE_FIRST || cc > CHAR_CODE_LAST)
      cc = CHAR_CODE_FIRST;

    var charIndex = cc - CHAR_CODE_FIRST;

    this.putChar(charIndex);
  }

  putChar(charIndex){
    var {g, img, sx, sy, x, y} = this;

    var xx = x * sx;
    var yy = y * sy;

    g.globalCompositeOperation = 'source-over';
    g.drawImage(img, charIndex * sx, 0, sx, sy, xx, yy, sx, sy);

    g.globalCompositeOperation = 'darker';
    g.fillStyle = this.textCol;
    g.fillRect(xx, yy, sx, sy);

    if(++this.x === this.ws)
      this.newLine();
  }

  newLine(){
    this.x = 0;
    this.y++;

    if(this.y === this.hs)
      this.scroll();
  }

  scroll(){
    var {g, canvas, w, h, sy} = this;

    g.globalCompositeOperation = 'source-over';

    this.y = this.hs - 1;
    g.drawImage(canvas, 0, -sy);

    g.fillStyle = this.bgCol;
    g.fillRect(0, h - sy, h, sy);
  }
};

module.exports = VisualConsole;

function getImg(imgPath){
  return new Promise(res => {
    var img;

    media.editImage(imgPath, '-', (w, h, g) => {
      img = g.canvas;
    }, () => {
      res(img);
    });
  });
}