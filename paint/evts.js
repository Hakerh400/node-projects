'use strict';

const O = require('../framework');

const evts = O.enum([
  'SET_COLOR',
  'MOVE_PEN',
  'DRAW_START',
  'DRAW_STOP',
  'FINISH',
]);

module.exports = evts;