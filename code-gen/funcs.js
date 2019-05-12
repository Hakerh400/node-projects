'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Entity = require('./entity.js');
const Scope = require('./scope.js');

class Function extends Entity{
  constructor(scope, name=null, args=[], ret=null){
    super(scope, name);

    this.args = args;
    this.ret = ret;

    this.innerScope = new Scope(scope);
  }

  addArg(r){ this.args.push(r); }
  isMethod(){ return 0; }
  isFunc(){ return 1; }
}

class Method extends Function{
  constructor(cs, name, args=[], ret=null){
    super(cs.scope, name, args, ret);

    this.class = cs;
    this.innerScope.addVar(This())
  }

  isCtor(){ return 0; }
  isMethod(){ return 1; }
}

class Constructor extends Method{
  constructor(cs, name, args){
    super(cs, name, args, cs);
  }

  isCtor(){ return 0; }
}

module.exports = {
  Function,
  Method,
  Constructor,
};