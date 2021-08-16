'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base{
  get ctor(){ return this.constructor; }

  *toStr(){ O.virtual('toStr'); }

  toString(){
    return O.rec([this, 'toStr']);
  }
}

module.exports = Base;