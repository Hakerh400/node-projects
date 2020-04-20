'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');

const opts = {
  rhsGroupsAllowedOnEnd: 0,
  rhsGroupsMustHaveRest: 1,
  preventTrivialLoops:   1,

  probabilities: {
    bit1:             .5,
    rest:             .3,

    lhsMore:          .7,
    rhsMore:          .7,
    rhsStartGroup:    .5,
    rhsMoreBitsOnEnd: .5,
  },
};

module.exports = opts;