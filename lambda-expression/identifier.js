'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class Identifier extends Element{
  static type = 0;

  constructor(id=null){
    super();
    
    this.id = id;
  }

  toString(nest=0){
    return this.getId(nest - this.id - 1);
  }
}

module.exports = Identifier;