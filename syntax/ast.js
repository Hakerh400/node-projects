'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class AST{
  constructor(elem){
    this.elem = elem;
  }
};

module.exports = AST;