'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const builtins = {
  'unProps': [
    'not',
  ],
  'binProps': [
    'and',
    'or',
    ['imp', '=>'],
  ],
  'binRels': [
    ['eq', '='],
    ['neq', 'distinct'],
  ],
  'bvRels': [
    'bvule',
    'bvult',
    'bvuge',
    'bvugt',
    'bvsle',
    'bvslt',
    'bvsge',
    'bvsgt',
  ],
  'bvUnOps': [
    'bvneg',
    'bvnot',
  ],
  'bvBinOps': [
    'bvadd',
    'bvsub',
    'bvmul',
    'bvurem',
    'bvsrem',
    'bvsmod',
    'bvshl',
    'bvlshr',
    'bvashr',
    'bvor',
    'bvand',
    'bvnand',
    'bvnor',
    'bvxnor',
  ],
};

module.exports = builtins;