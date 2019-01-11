'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class DottedSpace{
  constructor(w, h){
    this.d = new O.SimpleGrid(w, h, (x, y) => {
      return new Set();
    });

    this.dotsNum = 0;
  }

  len(){
    return this.dotsNum;
  }

  add(x, y){
    const {d} = this;

    const xn = x | 0;
    const yn = y | 0;
    if(!d.has(xn, yn)) return;

    const s = d.get(xn, yn);
    const p = new O.Vector(x, y);
    
    s.add(p);
    this.dotsNum++;
  }

  iter(func){
    this.d.iter((x, y, s) => {
      for(let p of s)
        func(p.x, p.y)
    });
  }

  filter(func){
    this.d.iter((x, y, s) => {
      for(let p of s){
        if(!func(p.x, p.y)){
          s.delete(p);
          this.dotsNum--;
        }
      }
    });
  }
};

module.exports = DottedSpace;