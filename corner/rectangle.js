'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Rectangle{
  constructor(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;

    this.x1 = x + w;
    this.y1 = y + h;
  }

  has(x, y){
    return x >= this.x && y >= this.y && x < this.x1 && y < this.y1;
  }
};

module.exports = Rectangle;