'use strict';

const O = require('omikron');
const Element = require('./element');

class Terminal extends Element{
  get type(){ return 0; }
}

module.exports = Terminal;