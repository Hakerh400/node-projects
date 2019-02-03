'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Entity = require('./entity.js');
const Scope = require('./scope.js');
const Class = require('./class.js');
const Type = require('./type.js');
const funcs = require('./funcs.js');
const vars = require('./vars.js');

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

class CodeGenerator{
  constructor(){
    this.scope = new Scope(null, ['bool']);
  }

  addClass(c){ this.scope.addClass(c); }
  addFunc(f){ this.scope.addFunc(f); }
  addVar(v){ this.scope.addVar(v); }

  getCode(){ return this.scope.toString(); }
};

module.exports = CodeGenerator;