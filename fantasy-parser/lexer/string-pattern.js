'use strict';

const O = require('omikron');
const Pattern = require('./pattern');

class StringPattern extends Pattern{
  constructor(str){
    super();
    this.str = str;
  }
}

module.exports = StringPattern;