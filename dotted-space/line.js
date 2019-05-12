'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Line{
  constructor(x, y, col){
    this.x = x;
    this.y = y;
    this.col = col;
    this.active = 1;
  }
}

module.exports = Line;