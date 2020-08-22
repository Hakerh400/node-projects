'use strict';

const O = require('omikron');

class LexerRule{
  context = null;
  pattern = null;
  tokens = [];
  action = null;

  setPattern(pat){
    O.assert(this.pattern === null);
    this.pattern = pat;
  }
}

module.exports = LexerRule;