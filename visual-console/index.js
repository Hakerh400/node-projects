'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const media = require('../media');

const CHAR_CODE_FIRST = O.cc(' ');
const CHAR_CODE_LAST = O.cc('~');

const cwd = __dirname;
const imgFile = path.join(cwd, 'ascii.png');

class VisualConsole{
  constructor(g, img, sx, sy, bgCol='#000000', textCol='#ffffff'){
    var canvas = g.canvas;

    this.canvas = canvas;
    this.g = g;

    this.w = canvas.width;
    this.h = canvas.height;

    this.img = img;
    this.aux = media.createContext(sx, sy);

    this.sx = sx;
    this.sy = sy;

    this.ws = this.w / sx | 0;
    this.hs = this.h / sy | 0;

    this.bgCol = bgCol;
    this.textCol = textCol;

    this.x = 0;
    this.y = 0;
  }

  static getCharsImg(){
    return new Promise(res => {
      var img;
      
      media.editImage(imgFile, '-', (w, h, g) => {
        img = g.canvas;
      }, () => {
        res(img);
      });
    });
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
    var {g, img, aux, sx, sy, x, y} = this;

    var xx = x * sx;
    var yy = y * sy;

    g.fillStyle = this.bgCol;
    g.fillRect(xx, yy, sx, sy);

    aux.clearRect(0, 0, sx, sy);
    aux.drawImage(img, charIndex * sx, 0, sx, sy, 0, 0, sx, sy);

    aux.globalCompositeOperation = 'source-in';
    aux.fillStyle = this.textCol;
    aux.fillRect(0, 0, sx, sy);
    aux.globalCompositeOperation = 'source-over';

    g.drawImage(aux.canvas, xx, yy);

    if(++this.x === this.ws)
      this.newLine();
  }

  newLine(){
    var {g, w, sx, sy, x, y} = this;

    g.fillStyle = this.bgCol;
    g.fillRect(x * sx, y * sy, w, sy);

    this.x = 0;
    this.y++;

    if(this.y === this.hs)
      this.scroll();
  }

  scroll(){
    var {g, canvas, w, h, sy} = this;

    this.y = this.hs - 1;
    g.drawImage(canvas, 0, -sy);

    g.fillStyle = this.bgCol;
    g.fillRect(0, h - sy, w, sy);
  }
}

module.exports = VisualConsole;