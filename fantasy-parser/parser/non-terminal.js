'use strict';

const O = require('omikron');
const Element = require('./element');

class NonTerminal extends Element{
  get type(){ return 1; }
}

module.exports = NonTerminal;