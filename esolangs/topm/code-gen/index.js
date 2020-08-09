'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const debug = require('../../../debug');

const r = O.rand;
const ri = O.randInt;

const PROB_START = .9;
const PROB_FACTOR = .8;

const codeGen = () => {
  const list = prob => {
    const len = ri(r(2), prob);

    return O.ca(len, () => {
      return `(${list(prob * PROB_FACTOR)})`;
    }).join('');
  };

  return list(PROB_START);
};

module.exports = codeGen;