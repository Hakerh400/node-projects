'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const arrOrder = require('../../../arr-order');
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

const identChars = (
  O.chars('a', 'z') +
  O.chars('A', 'Z')
);

const codeGen = () => {
  const idents = O.ca(6, () => O.obj());
  let identsNum = 0;

  const gen = (depth, arity, flags=0) => {
    if(arity === 0)
      return `${O.ca(ri(0, .5), () => `~+${r()}`).join('')}.0`;

    basicFuncs: {
      if(depth === 0) break basicFuncs;
      if(flags & MINIFN) break basicFuncs;
      if(rf() < PROB_START * PROB_FACTOR ** depth) break basicFuncs;

      const a = O.arr2obj(arrc);

      if(flags & TARGET) a[0] = a[2] = 0;
      if(arity !== 1) a[1] = 0;

      const b = arrc.filter(b => a[b]);
      if(b.length === 0) break basicFuncs;

      const c = re(b) | 0;

      if(c === 0) return identMaybe(depth, arity, 0, () => `.${snum(arity)}`);
      if(c === 1) return identMaybe(depth, arity, 1, () => `+${r(2)}`);
      if(c === 2) return identMaybe(depth, arity, 2, () => `%${snum2(arity, r(arity))}`);
    }

    const depth1 = depth + 1;

    combinators: {
      const a = O.arr2obj(arrc);

      if(r(4)) a[2] = 0;

      const b = O.keys(a).filter(b => a[b]);
      if(b.length === 0) break combinators;

      const c = re(b) | 0;

      if(c === 0){
        const arityNew = (rf() < .95) + ri(0, .5);

        return identMaybe(depth, arity, 3, () => `~${
          arityNew === 0 ? snum(arity) : ''}${
          gen(depth1, arityNew, TARGET)}${
          O.ca(arityNew, () => gen(depth1, arity)).join('')}`);
      }

      if(c === 1){
        return identMaybe(depth, arity, 4, () => `-${
          gen(depth1, arity - 1)}${
          O.ca(2, () => gen(depth1, arity + 1)).join('')}`);
      }

      if(c === 2){
        return identMaybe(depth, arity, 5, () => `*${
          gen(depth1, arity + 1, MINIFN)}`);
      }
    }
  };

  const identMaybe = (depth, arity, type, genFunc) => {
    const obj = idents[type];

    refIdent: {
      if(!(arity in obj)) break refIdent;
      if(rf() < PROB_START * PROB_FACTOR ** depth) break refIdent;

      return O.randElem(obj[arity]);
    }

    return add(obj, arity, genFunc());
  };

  const add = (obj, arity, funcStr) => {
    if(!(arity in obj)) obj[arity] = [];

    const ident = `\\${arrOrder.str(identChars, ++identsNum)}`;
    const defStr = `${ident}${funcStr}`;

    obj[arity].push(ident);

    return defStr;
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