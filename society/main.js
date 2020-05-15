'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const N = 26;

const main = () => {
  const n = N;
  const k = (Math.log(n + 1) / Math.log(2)) ** 2;
  const p = Math.min(k / n, .5);

  while(1){
    const grid = new Grid(n, n + 2, (x, y) => {
      if(x === y) return null;
      if(O.randf() > p) return null;
      return O.rand();
    });

    const ents = grid.getEntsInfo();

    if(ents.reduce((a, b) => a + b, 0) >= 3){
      log(grid.toString());
      log();
      log(`${' '.repeat(3)}${ents.join('')}`);

      break;
    }
  }
};

class Grid extends O.Grid{
  constructor(w, h, func){
    assert(h === w + 2);
    super(w, h, func);
  }

  getEntsInfo(){
    const {w, h} = this;
    const ents = O.ca(w, () => 1);
    const nonMarked = new Set(O.ca(w, i => i));

    const mark = id => {
      assert(ents[id] === 1);
      ents[id] = 0;
      nonMarked.delete(id);
    };

    for(let x = 0; x !== w; x++)
      if(this.get(x, w) !== 1 || this.get(x, w + 1) !== 0)
        mark(x);

    while(1){
      let found = 1;

      while(found){
        found = 0;

        for(const x of nonMarked){
          for(let y = 0; y !== w; y++){
            const m = ents[y];
            const d = this.get(x, y);
            if(d === null) continue;

            if(m ^ d){
              mark(x);
              found = 1;
              break;
            }
          }
        }
      }

      const set = new Set();
      let updated = 1;

      while(updated){
        updated = 0;

        for(const x of nonMarked){
          if(x in set) continue;

          for(let y = 0; y !== w; y++){
            const m = ents[y];
            const d = this.get(x, y);
            if(d === null) continue;

            if(m & !d){
              set.add(x);
              updated = 1;
              break;
            }
          }
        }
      }

      if(set.size === 0) break;

      for(const id of set)
        mark(id);
    }

    return ents;
  }

  toString(){
    const {w, h} = this;
    assert(w <= 26);

    const tab = ' '.repeat(2);

    let str = ` ${tab}${O.ca(w, i => idToStr(i)).join('')}`;
    str += `\n ${tab}${'\x5F'.repeat(w)}`;

    this.iter((x, y, d) => {
      if(x === 0 && y === w)
        str += `\n${tab}|${'-'.repeat(w)}`;

      if(x === 0)
        str += `\n${y < w ? idToStr(y) : '+-'[y - w]} |`;

      str += d !== null ? String(d) : '.';
    });

    return str;
  }
}

const idToStr = id => {
  return O.sfcc(O.cc('A') + id);
};

main();