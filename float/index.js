'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const fi = a => a;
const f0 = () => 0;

class Float{
  constructor(s, m, e){
    this.s = s & 1;
    this.m = m;
    this.e = e;
  }

  neg(){
    var {s, m, e} = this;
    return new Float(!s, m, e);
  }

  abs(){
    var {s, m, e} = this;
    return new Float(0, m, e);
  }

  eq(n){
    var {s, m, e} = this;
    return s === n.s & m.eq(n.m) & e.eq(n.e);
  }

  neq(n){
    var {s, m, e} = this;
    return s !== n.s | m.neq(n.m) | e.neq(n.e);
  }

  gt(n){
    var {s, m, e} = this;
    return !s & n.s | e.gt(n.e) | e.eq(n.e) & m.gt(n.m);
  }

  lt(n){
    var {s, m, e} = this;
    return s & !n.s | e.lt(n.e) | e.eq(n.e) & m.lt(n.m);
  }

  gte(n){
    return this.eq(n) | this.gt(n);
  }

  lte(n){
    return this.eq(n) | this.lt(n);
  }

  op(n, s, f){
    var {m, e} = this;
    var {m: m1, e: e1} = n;
    var ms = m.s;

    m = m.expand().shrb();
    m1 = m1.expand().shrb();

    m.set(ms * 2 - 1, 1);
    m1.set(ms * 2 - 1, 1);

    var d1 = e.lte(e1);
    while(e.neq(e1)){
      if(d1){
        m = m.shrb();
        e = e.inc();
      }else{
        m1 = m1.shrb();
        e1 = e1.inc();
      }
    }

    m = f(m, m1);
    if(m.z()) throw 'zero';

    e = e.add(new Uint(e.s, i => !!(ms & (1 << i))));
    while(!m.getLast()){
      m = m.shlb();
      e = e.dec();
    }

    m = m.shlb().round();

    return new Float(s, m, e);
  }

  add(n){
    var b = this;
    var {s, m, e} = b;
    var s1 = n.s;

    if(s | s1){
      if(s & s1)
        return b.op(n, 1, (m, m1) => m.add(m1));

      if(s) [b, n] = [n, b];
      s = b.lt(n.neg());
      if(s) [b, n] = [n, b];

      return b.op(n, s, (m, m1) => m.sub(m1));
    }

    return b.op(n, 0, (m, m1) => m.add(m1));
  }

  sub(n){
    return this.add(n.neg());
  }

  mul(n){
    var {s, m, e} = this;
    var {s: s1, m: m1, e: e1} = n;
    var ms = m.s;

    var ui = new Uint(ms, i => !!(ms & (i < 32 ? 1 << i : 0)));
    m = m.expand().shr(ui);
    m1 = m1.expand().shr(ui);

    m.set(ms, 1);
    m1.set(ms, 1);

    m = m.mul(m1);
    if(m.z()) throw 'zero';

    e = e.add(e1).add(new Uint(e.s, i => !!(ms - e.os + 1 & (1 << i))));
    while(!m.getLast()){
      m = m.shlb();
      e = e.dec();
    }

    m = m.shlb().round();

    return new Float(s ^ s1, m, e);
  }

  div(n){
    var {s, m, e} = this;
    var {s: s1, m: m1, e: e1} = n;
    var ms = m.s;

    var ui = new Uint(ms, i => !!(ms - 1 & (i < 32 ? 1 << i : 0)));
    m = m.expand().shl(ui);
    m1 = m1.expand().shl(ui);

    m.set(ms * 3 - 1, 1);
    m1.set(ms * 3 - 1, 1);

    m.log();
    m1.log();
    m.div(m1).log();

    m = m.div(m1);
    if(m.z()) throw 'zero';

    e = e.add(e1).add(new Uint(e.s, i => !!(ms - e.os + 1 & (1 << i))));
    while(!m.getLast()){
      m = m.shlb();
      e = e.dec();
    }

    m = m.shlb().round();

    return new Float(s ^ s1, m, e);
  }

  num(){
    var val = this.m.m() * 2 ** this.e.e();
    if(this.s === 1) val  = -val;
    return val;
  }

  log(){
    return this.m.log();
  }
};

class Uint{
  constructor(s, f=f0){
    this.s = s | 0;
    this.os = 1 - 2 ** (s - 1);

    var arr = O.ca(s, i => f(i) & 1);
    this.d = Buffer.from(arr);
  }

  get(i){
    return this.d[i];
  }

  set(i, a){
    this.d[i] = a & 1;
  }

  getLast(){
    return this.get(this.s - 1);
  }

  setLast(a){
    this.set(this.s - 1, a);
  }

  zero(){
    return new Uint(this.s);
  }

  one(){
    return new Uint(this.s, i => !i);
  }

  iter(f, dir=1){
    const {d} = this;
    if(dir) d.forEach((a, i) => f(a, i));
    else for(var i = this.s - 1; i !== -1; i--) f(d[i], i);
  }

  map(f, dir=1, dirm=1){
    var d = [];
    this.iter((a, i) => {
      var v = f(a, i) & 1;
      if(dirm) d.push(v);
      else d.unshift(v);
    }, dir);
    return new Uint(this.s, i => d[i]);
  }

  red(f, v, dir=1){
    this.iter((a, i) => v = f(v, a, i), dir);
    return v;
  }

  copy(){
    return this.map(fi);
  }

  rev(){
    return this.map(fi, 0);
  }

  expand(){
    return new Uint(this.s * 3, i => {
      i -= this.s;
      if(i < 0 || i >= this.s) return 0;
      return this.get(i);
    });
  }

  round(){
    var s = this.s / 3 | 0;
    var z = 1;

    this.iter((a, i) => {
      if(i < s * 2 - 1)
        z &= !a;
    });

    var b = new Uint(s, i => {
      return this.get(this.s - s + i);
    });

    if(this.get(s * 2 - 1) & (!z | b.odd()))
      b = b.inc();

    return b;
  }

  even(){
    return !this.get(0);
  }

  odd(){
    return this.get(0);
  }

  eq(n){
    var eq = 1;
    this.iter((a, i) => eq &= !(a ^ n.get(i)));
    return eq;
  }

  neq(n){
    return !this.eq(n);
  }

  gt(n){
    var gt = 0;
    this.iter((a, i) => {
      var b = n.get(i);
      gt = gt & (a | !b) | a & !b;
    });
    return gt;
  }

  lt(n){
    var lt = 0;
    this.iter((a, i) => {
      var b = n.get(i);
      lt = lt & (!a | b) | !a & b;
    });
    return lt;
  }

  gte(n){
    var gte = 1;
    this.iter((a, i) => {
      var b = n.get(i);
      gte = gte & (a | !b) | a & !b;
    });
    return gte;
  }

  lte(n){
    var lte = 1;
    this.iter((a, i) => {
      var b = n.get(i);
      lte = lte & (!a | b) | !a & b;
    });
    return lte;
  }

  neq(n){
    return !this.eq(n);
  }

  z(){
    var z = 1;
    this.iter(a => z &= !a);
    return z;
  }

  nz(){
    return !this.z();
  }

  not(){
    return this.map((a, i) => !a);
  }

  neg(){
    return this.sub(this.zero());
  }

  and(n){
    return this.map((a, i) => a & n.get(i));
  }

  or(n){
    return this.map((a, i) => a | n.get(i));
  }

  xor(n){
    return this.map((a, i) => a ^ n.get(i));
  }

  inc(){
    var c = 1;
    return this.map((a, i) => {
      var v = a ^ c;
      c &= a;
      return v;
    });
  }

  dec(){
    var e = 1;
    return this.map((a, i) => {
      var v = a ^ e;
      e &= !a;
      return v;
    });
  }

  add(n){
    var c = 0;
    return this.map((a, i) => {
      var b = n.get(i);
      var v = a ^ b ^ c;
      c = a & b | a & c | b & c;
      return v;
    });
  }

  sub(n){
    var e = 0;
    return this.map((a, i) => {
      var b = n.get(i);
      var v = a ^ b ^ e;
      e = !a & (b | e) | a & b & e;
      return v;
    });
  }

  shlb(v=0){
    return this.map((a, i) => {
      var vv = v;
      v = a;
      return vv;
    });
  }

  shrb(v=0){
    return this.map((a, i) => {
      var vv = v;
      v = a;
      return vv;
    }, 0, 0);
  }

  shl(n){
    var b = this;
    while(n.nz()){
      n = n.dec();
      b = b.shlb(0);
    }
    return b;
  }

  shr(n){
    var b = this;
    while(n.nz()){
      n = n.dec();
      b = b.shrb(0);
    }
    return b;
  }

  mul(n){
    var b = this.zero();
    this.iter((a, i) => {
      if(a) b = b.add(n);
      n = n.shlb();
    });
    return b;
  }

  div(n){
    var q = this.zero();
    var r = this.zero();
    this.iter((a, i) => {
      r = r.shlb(a);
      if(r.gte(n)){
        r = r.sub(n);
        q.set(i, 1);
      }
    }, 0);
    return q;
  }

  exp(n){
    var b = this.one();
    while(n.nz()){
      n = n.dec();
      b = b.mul(this);
    }
    return b;
  }

  m(){
    return this.red((a, b, i) => a + b * 2 ** -(this.s - i), 1, 0);
  }

  e(){
    return this.red((a, b, i) => a + b * 2 ** i, this.os);
  }

  int(){
    return this.red((a, b, i) => a + b * 2 ** i, 0);
  }

  log(){
    return log(`1.${
      [...this.d]
      .reverse()
      .join('')
    }`);
  }
};

module.exports = {
  Float,
  Uint,
};