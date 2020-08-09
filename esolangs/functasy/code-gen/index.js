'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const debug = require('../../../debug');

const {min, max} = Math;

const r = O.rand;
const ri = O.randInt;

const PROB_START = .5;
const PROB_FACTOR = .95;

const codeGen = () => {
  const elem = (depth, prob) => {
    if(depth !== 0 && r(3)) return ident(depth);
    return list(depth, prob);
  };

  const elems = (depth, prob) => {
    const len = ri(r(max(5 - depth, 0)), prob);

    return O.ca(len, () => {
      return elem(depth, prob);
    }).join('');
  };

  const list = (depth, prob) => {
    return `(${elems(depth + 1, prob * PROB_FACTOR)})`;
  };

  const ident = depth => {
    return `${r(depth)}.`;
  };

  return elems(0, PROB_START).
    replace(/(?<=\d)\.(?=\d)/g, ' ').
    replace(/\./g, '');
};

module.exports = codeGen;