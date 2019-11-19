'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const gcd = require('../gcd');

const {ok} = assert;

class Rational{
  #a = 0n;
  #b = 1n;

  constructor(a=0n, b=1n){
    this.a = a;
    this.b = b;
  }

  slice(){
    return new Rational(this.#a, this.#b);
  }

  get a(){
    return this.#a;
  }

  set a(a){
    this.#a = a;
    this.simplify();
  }

  get b(){
    return this.#b;
  }

  set b(b){
    this.#b = b;
    this.simplify();
  }

  simplify(){
    const a = this.#a;
    const b = this.#b;

    ok(typeof a === 'bigint');
    ok(typeof b === 'bigint');
    ok(b !== 0n);

    if(a === 0n) return this;

    const pos = (a > 0n) === (b > 0n);
    const aa = a > 0n ? a : -a;
    const bb = b > 0n ? b : -b;

    const c = gcd(aa, bb);
    if(c === 1n) return this;

    this.#a = (pos ? aa : -aa) / c;
    this.#b = bb / c;

    return this;
  }

  eq(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a === c && b === d;
  }

  lt(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d < b * c;
  }

  gt(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a * d > b * c;
  }

  lte(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a === c && b === d || a * d < b * c;
  }

  gte(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    return a === c && b === d || a * d > b * c;
  }

  set(r){
    ok(r instanceof Rational);

    this.#a = r.#a;
    this.#b = r.#b;

    return this;
  }

  add(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    this.#a = a * d + b * c;
    this.#b = b * d;

    return this.simplify();
  }

  sub(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    this.#a = a * d - b * c;
    this.#b = b * d;

    return this.simplify();
  }

  mul(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;

    this.#a = a * c;
    this.#b = b * d;

    return this.simplify();
  }

  div(r){
    ok(r instanceof Rational);

    const a = this.#a, b = this.#b;
    const c = r.#a, d = r.#b;
    ok(c !== 0n);

    this.#a = a * d;
    this.#b = b * c;

    return this.simplify();
  }

  toFloat(){
    return Number(this.#a) / Number(this.#b);
  }

  [Symbol.toPrimitive](){ assert.fail(); }
}

module.exports = Rational;