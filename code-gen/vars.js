'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Entity = require('./entity.js');
const Scope = require('./scope.js');

class Variable extends Entity{
  constructor(scope, name, type){
    super(scope, name);

    this.type = type;
  }

  isAttrib(){ return 0; }
  isArg(){ return 0; }
  isVar(){ return 1; }
};

class Attribute extends Variable{
  constructor(cs, name, type){
    super(cs.scope, name, type);
    this.class = cs;
  }

  isThis(){ return 0; }
  isAttrib(){ return 1; }
};

class This extends Attribute{
  constructor(cs){
    super(cs, 'this', cs);
  }

  isThis(){ return 1; }
};

class Argument extends Variable{
  constructor(func, name, type){
    super(func.innerScope, name, type);
    this.func = func;
  }

  isArg(){ return 1; }
};

module.exports = {
  Variable,
  Attribute,
  This,
  Argument,
};