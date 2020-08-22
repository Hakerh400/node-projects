'use strict';

const O = require('omikron');

class Lexer{
  rules = [];

  addRule(rule){
    this.rules.push(rule);
  }
}

module.exports = Lexer;