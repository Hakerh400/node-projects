'use strict';

const assert = require('assert');
const O = require('omikron');

class LexerRule{
  context = null;
  pattern = null;
  terms = [];
  action = null;

  setPattern(pat){
    assert(this.pattern === null);
    this.pattern = pat;
  }

  addTerm(tok){
    this.terms.push(tok);
  }
}

module.exports = LexerRule;