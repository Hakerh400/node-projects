'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const fi = a => a;
const f0 = () => 0;

class Float{
  constructor(ms, es, mf=f0, ef=f0){
    this.ms = ms;
    this.es = es;

    this.m = new BitArray(ms, mf);
    this.e = new BitArray(es, ef);
  }

  toString(){
    return String(this.m.m() * 2 ** this.e.e());
  }
};

module.exports = Float;

class BitArray{
  constructor(s, f=f0){
    this.s = s;
    this.os = 1 - 2 ** (s - 1);
    this.d = Buffer.from(O.ca(s, i => f(i) & 1));
  }

  get(i){
    return this.d[i];
  }

  set(i, a){
    this.d[i] = a & 1;
  }

  iter(f, dir=1){
    const {d} =this;
    if(dir) d.forEach((a, i) => f(a, i));
    else for(var i = this.s - 1; i !== -1; i--) f(d[i], i);
  }

  map(f, dir=1){
    var d = [];
    this.iter((a, i) => d.push(f(a, i) & 1), dir);
    return new BitArray(this.s, i => d[i]);
  }

  red(f, v){
    this.iter((a, i) => v = f(v, a, i));
    return v;
  }

  copy(){
    return this.map(fi);
  }

  rev(){
    return this.map(fi, 0);
  }

  m(){
    return this.red((a, b, i) => a + b * 2 ** -(i + 1), 1);
  }

  e(){
    return this.red((a, b, i) => a + b * 2 ** i, this.os);
  }

  toString(){
    var s = '';
    this.iter(a => s += a);
    return s;
  }
};