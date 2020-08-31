'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const debug = require('../../../debug');

const {min, max} = Math;

const r = O.rand;
const ri = O.randInt;
const rf = O.randf;
const re = O.randElem;

const PROB_START = .9;
const PROB_FACTOR = .85;

const TARGET = 1 << 0;
const MINIFN = 1 << 1;

const arrc = [0, 1, 2];

const codeGen = () => {
  const gen = (depth, arity, flags=0) => {
    basicFuncs: {
      if(depth === 0) break basicFuncs;
      if(flags & MINIFN) break basicFuncs;
      if(rf() < PROB_START * PROB_FACTOR ** depth) break basicFuncs;

      const a = O.arr2obj(arrc);

      if(flags & TARGET) a[0] = a[2] = 0;
      if(arity !== 1) a[1] = 0;
      if(arity === 0) a[2] = 0;

      const b = arrc.filter(b => a[b]);
      if(b.length === 0) break basicFuncs;

      const c = re(b) | 0;

      if(c === 0) return `.${snum(arity)}`;
      if(c === 1) return `+${r(2)}`;
      if(c === 2) return `%${snum2(arity, r(arity))}`;
    }

    depth++;

    combinators: {
      const a = O.arr2obj(arrc);

      if(arity === 0) a[1] = 0;
      if(r(4)) a[2] = 0;

      const b = O.keys(a).filter(b => a[b]);
      if(b.length === 0) break combinators;

      const c = re(b) | 0;

      if(c === 0){
        const arityNew = r() + r() + ri(0, .5);

        return `~${
          arityNew === 0 ? snum(arity) : ''}${
          gen(depth, arityNew, TARGET)}${
          O.ca(arityNew, () => gen(depth, arity)).join('')}`;
      }

      if(c === 1){
        return `-${
          gen(depth, arity - 1)}${
          O.ca(2, () => gen(depth, arity + 1)).join('')}`;
      }

      if(c === 2){
        return `*${
          gen(depth, arity + 1, MINIFN)}`;
      }
    }
  };

  const snum = num => {
    const s = String(num);
    if(s.length === 1) return s;
    return `\\${s}`;
  };

  const snum2 = (num1, num2) => {
    assert(num2 < num1);
    const s1 = String(num1);
    const s2 = String(num2);
    if(s1.length === 1) return s1 + s2;
    return `\\${s1}\\${s2}`;
  };

  return gen(0, 1);
};

module.exports = codeGen;