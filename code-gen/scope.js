'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Entity = require('./entity.js');

class Scope extends Entity{
  constructor(scope=null, classes=[], funcs=[], vars=[]){
    super(scope);

    this.classes = classes;
    this.funcs = funcs;
    this.vars = vars;
  }

  addClass(c){ this.classes.push(c); }
  addFunc(f){ this.funcs.push(f); }
  addVar(v){ this.vars.push(v); }

  addEntity(ent){
    if(ent.isClass()) this.addClass(ent);
    else if(ent.isFunc(this.addFunc(ent)));
    else if(ent.isVar(this.addVar(ent)));
    else throw new TypeError('Unknown entity');
  }

  isScope(){ return 1; }
};

module.exports = Scope;