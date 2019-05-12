'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Entity = require('./entity.js');
const Scope = require('./scope.js');

class Class extends Entity{
  constructor(scope, name, ext=null, attribs=[], methods=[], ctor=null){
    super(scope, name);

    this.ext = ext;
    this.attribs = attribs;
    this.methods = methods;
    this.ctor = ctor;
  }

  addAttrib(a){ this.attribs.push(a); }
  addMethod(m){ this.methods.push(m); }

  isBase(){ return this.ext === null; }
  isExtended(){ return this.ext !== null; }
  isClass(){ return 1; }

  toString(i=''){
    const j = i + TAB;

    return `class ${this.name}${
      this.isExtended() ? ` extends ${this.ext.name}` : ''
    }{\n${j}${
      this.ctor.toString(j)
    }${
      this.methods.map(a => `\n${j}${a.toString(j)}`)
    }\n${i}};`;
  }
}

module.exports = Class;