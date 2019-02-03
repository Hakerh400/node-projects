'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Entity = require('./entity.js');
const Scope = require('./scope.js');

class Type{
  constructor(params){
    this.params = params;
  }

  static paramsEq(p1, p2){
    const a1 = Array.isArray(p1);
    const a2 = Array.isArray(p2);

    if(a1 !== a2) return 0;
    if(!a1) return p1 === p2;
    if(p1.length !== p2.length) return 0;

    return p1.every((p, i) => {
      return Type.paramsEq(p, p2[i]);
    });
  }

  addEntity(ent){
    if(ent.isClass()) this.addClass(ent);
    else if(ent.isFunc(this.addFunc(ent)));
    else if(ent.isVar(this.addVar(ent)));
    else throw new TypeError('Unknown entity');
  }

  eq(type){ return Type.paramsEq(this.params, type.params); }
  neq(type){ return !this.eq(type); }

  isScope(){ return 1; }

  toString(){ throw new TypeError('Type should not be stringified'); }
};

module.exports = Type;