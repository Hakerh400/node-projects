'use strict';

const O = require('omikron');

class Element{
  constructor(name){
    this.name = name;
  }

  get type(){ O.virtual('type'); }
}

module.exports = Element;