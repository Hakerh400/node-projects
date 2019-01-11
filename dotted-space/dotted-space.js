'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class DottedSpace{
  constructor(w, h){
    this.w = w;
    this.h = h;

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

    for(let p of s)
      if(p.x === x && p.y === y)
        return;

    s.add(new O.Vector(x, y));
    this.dotsNum++;
  }

  remove(x, y){
    const {d} = this;

    const xn = x | 0;
    const yn = y | 0;
    if(!d.has(xn, yn)) return;

    const s = d.get(xn, yn);

    for(let p of s){
      if(p.x === x && p.y === y){
        s.delete(p);
        this.dotsNum--;
      }
    }
  }

  iter(xs, ys, w, h, func){
    const {d} = this;

    let x1 = xs | 0, y1 = ys | 0;
    let x2 = xs + w | 0, y2 = ys + h | 0;

    for(let y = y1; y <= y2; y++){
      for(let x = x1; x <= x2; x++){
        if(!d.has(x, y)) continue;

        let s = d.get(x, y);

        for(let p of s){
          if(func(p.x, p.y)){
            s.delete(p);
            this.dotsNum--;
          }
        }
      }
    }
  }

  nearest(xs, ys, n=0){
    if(n >= this.len()) return null;

    const {w, h, d} = this;

    let x1 = xs | 0, y1 = ys | 0;
    let x2 = x1, y2 = y1;
    let ps = new Set();
    let counter = 2;

    while(1){
      for(let x = x1; x <= x2; x++){
        if(d.has(x, y1))
          for(let p of d.get(x, y1))
            ps.add(p);

        if(d.has(x, y2))
          for(let p of d.get(x, y2))
            ps.add(p);
      }

      for(let y = y1; y <= y2; y++){
        if(d.has(x1, y))
          for(let p of d.get(x1, y))
            ps.add(p);

        if(d.has(x2, y))
          for(let p of d.get(x2, y))
            ps.add(p);
      }

      if(ps.size > n && counter-- === 0)
        break;

      x1--, y1--;
      x2++, y2++;
    }

    let psArr = Array.from(ps);

    psArr.sort((p1, p2) => {
      if(p1.dist(xs, ys) <= p2.dist(xs, ys)) return -1;
      return 1;
    });

    return psArr[n];
  }

  clear(){
    this.d.iter((x, y, s) => s.clear());
    this.dotsNum = 0;
  }

  reset(){
    this.clear();
  }
};

module.exports = DottedSpace;