'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');

const opts = {
  rhsGroupsAllowedOnEnd: 1,

  probabilities: {
    bit1:             .5,
    rest:             .33,

    lhsMore:          .75,
    rhsMore:          .75,
    rhsStartGroup:    .5,
    rhsMoreBitsOnEnd: .5,
  },
};

module.exports = opts;