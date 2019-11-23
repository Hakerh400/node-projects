'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Pointer{
  constructor(node, cost){
    this.node = node;
    this.cost = cost;
  }
}

module.exports = Pointer;