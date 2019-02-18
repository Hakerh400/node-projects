'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');
const AST = require('./ast');

class StackFrame{
  constructor(elem){
    this.elem = elem;
  }
};

module.exports = StackFrame;