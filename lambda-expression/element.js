'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Element{
  static type = null;

  getId(id){
    return O.sfcc(O.cc('a') + id);
  }

  get type(){ return this.constructor.type; }
  toString(nest=0){ O.virtual('toString'); }
}

module.exports = Element;