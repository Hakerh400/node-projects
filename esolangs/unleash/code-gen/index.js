'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const debug = require('../../../debug');

const r = O.rand;
const ri = O.randInt;

const PROB_START = .99;
const PROB_FACTOR = .8;

const instNames = '+-~*.%';
const instArgs = [3, 2, 3, 2, 1, 1];

const codeGen = () => {
  const elem = prob => {
    if(r(3)) return inst();
    return list(prob);
  };

  const elems = prob => {
    const len = ri(r(2), prob);

    return O.ca(len, () => {
      return elem(prob * PROB_FACTOR);
    }).join('');
  };

  const list = prob => {
    return `(${elems(prob)})`;
  };

  const inst = () => {
    const instIndex = r(6);

    return `${instNames[instIndex]}${O.ca(r(instArgs), () => {
      return ri(r(2), .9);
    }).join('|')}`
  };

  return elems(PROB_START);
};

module.exports = codeGen;