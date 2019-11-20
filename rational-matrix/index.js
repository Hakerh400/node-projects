'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('omikron');
const Rational = require('../rational');
const Table = require('../table');

class Matrix{
  #d;

  constructor(w, h, idents){
    this.target = idents[0];
    idents = idents.slice(1);

    const n = w - idents.length - 1;

    for(let i = 0; i < n; i++)
      idents.push(`s${i + 1}`);

    idents.push('Sum');

    this.w = w;
    this.h = h;
    this.idents = idents;
    this.varsNum = this.w - this.h;
    this.g = w - h - this.varsNum;

    this.#d = O.ca(h, () => O.ca(w, () => new Rational()));
  }

  get(x, y){
    const {w, h} = this;
    assert(x >= 0 && y >= 0 && x < w && y < h);
    return this.#d[y][x];
  }

  set(x, y, val){
    const {w, h} = this;

    assert(x >= 0 && y >= 0 && x < w && y < h);
    assert(val instanceof Rational);

    this.#d[y][x].set(val);
    return this;
  }

  add(x, y, val){
    const {w, h} = this;

    assert(x >= 0 && y >= 0 && x < w && y < h);
    assert(val instanceof Rational);

    this.#d[y][x].add(val);
    return this;
  }

  sub(x, y, val){
    const {w, h} = this;

    assert(x >= 0 && y >= 0 && x < w && y < h);
    assert(val instanceof Rational);

    this.#d[y][x].sub(val);
    return this;
  }

  mul(x, y, val){
    const {w, h} = this;

    assert(x >= 0 && y >= 0 && x < w && y < h);
    assert(val instanceof Rational);

    this.#d[y][x].mul(val);
    return this;
  }

  div(x, y, val){
    const {w, h} = this;

    assert(x >= 0 && y >= 0 && x < w && y < h);
    assert(val instanceof Rational);

    this.#d[y][x].div(val);
    return this;
  }

  iter(func){
    const {w, h} = this;

    for(let y = 0; y !== h; y++){
      for(let x = 0; x !== w; x++){
        const res = func(x, y, this.get(x, y));
        if(res !== undefined) this.set(x, y, res);
      }
    }
  }

  expand(){
    const {idents, varsNum} = this;
    const w = ++this.w;
    const h = ++this.h;
    const d = this.#d;

    idents.splice(idents.length - 1, 0, `g${++this.g}`);

    for(const row of d)
      row.splice(row.length - 1, 0, new Rational());

    d.push(O.ca(w, () => new Rational()));

    return this;
  }

  toString(){
    const {w, h, idents} = this;

    const table = new Table(idents);

    for(let y = 0; y !== h; y++){
      table.addRow(O.ca(this.w, x => {
        const a = this.get(x, y).toFloat();
        return Math.round(a * 1e3) / 1e3;
      }));
    }

    return table.toString();
  }
}

module.exports = Matrix;