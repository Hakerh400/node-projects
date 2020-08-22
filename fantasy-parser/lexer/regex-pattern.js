'use strict';

const O = require('omikron');
const Pattern = require('./pattern');

class RegexPattern extends Pattern{
  constructor(reg){
    super();
    this.reg = reg;
  }
}

module.exports = RegexPattern;