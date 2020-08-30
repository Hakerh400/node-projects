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

const PROB_START = .9;
const PROB_FACTOR = .85;

const codeGen = () => {
  const gen = (depth, arity) => {
    if(rf() > PROB_START * PROB_FACTOR ** depth){
      while(1){
        const a = r(3);

        if(a === 0){
          return `.\\${arity}`;
        }

        if(a === 1){
          if(arity !== 1) continue;
          return `+${r(2)}`;
        }

        if(a === 2){
          if(arity === 0) continue;
          return `%\\${arity}\\${r(arity)}`;
        }
      }
    }

    depth++;

    while(1){
      const a = r(arity !== 0 ? 3 : 2);

      if(a === 0){
        const arityNew = r() + r() + ri(0, .5);

        return `~${
          arityNew === 0 ? `\\${arity}` : ''}${
          gen(depth, arityNew)}${
          O.ca(arityNew, () => gen(depth, arity)).join('')}`;
      }

      if(a === 1){
        if(arity === 0) continue;
        return `-${
          gen(depth, arity - 1)}${
          O.ca(2, () => gen(depth, arity + 1)).join('')}`;
      }

      if(a === 2){
        return `*${
          gen(depth, arity + 1)}`;
      }
    }
  };

  return gen(0, 1);
};

module.exports = codeGen;