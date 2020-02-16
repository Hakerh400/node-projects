'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');

const opts = {
  probabilities: {
    userTypes: [1, .8],
    userFuncs: [1, .8],
    attrs:     [0, .5],
    args:      [1, .5],
  },
};

module.exports = opts;