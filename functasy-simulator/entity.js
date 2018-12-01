'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const functasy = require('../functasy');

class Entity{
  constructor(src, w, h, x, y, col){
    var eng = new functasy.Engine(src);;
    this.eng = eng;

    eng.read = this.read.bind(this);
    eng.write = this.write.bind(this);

    this.w = w;
    this.h = h;
    this.x = x;
    this.y = y;

    this.col = col;

    this.r = 0;
  }

  tick(num){
    const {eng} = this;
    if(eng.stack.length === 0) return;

    while(num-- !== 0){
      eng.run(1);
    }
  }

  draw(g){
    g.fillStyle = this.col;
    g.beginPath();
    g.arc(this.x, this.y, 10, 0, O.pi2);
    g.fill();
  }

  read(){
    if(this.r === 0){
      this.r = 1;
      return 1;
    }

    this.r = 0;
    return this.y & 1;
  }

  write(bit){
    this.num = 0;

    this.x = O.bound(this.x + (bit ^ 0), 0, this.w - 1);
    this.y = O.bound(this.y + (bit ^ 1), 0, this.h - 1);
  }
}

module.exports = Entity;