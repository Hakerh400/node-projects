'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Entity{
  constructor(scope=null, name=null){
    this.scope = scope;
    this.name = name;
  }

  isGlobal(){ return this.scope === null; }
  isLocal(){ return this.scope !== null; }

  isScope(){ return 0; }
  isClass(){ return 0; }
  isFunc(){ return 0; }
  isVar(){ return 0; }

  toString(){ throw new TypeError('Entity.prototype.toString is virtual'); }
}

module.exports = Entity;