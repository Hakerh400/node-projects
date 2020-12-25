'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

const kCtor = Symbol('ctor');

class TextAttribute extends cs.Constant{
  constructor(scheme, sym){
    assert(sym === kCtor);
    super(scheme);
  }

  static getName(){ O.virtual('name'); }
  get name(){ return this.constructor.getName(); }
  get val(){ return this.name; }

  static isSupported(name){
    return name in instancesObj;
  }

  static getType(name){
    assert(this.isSupported(name));
    return instancesObj[name];
  }
}

class Underline extends TextAttribute{
  static getName(){ return 'underline'; }
}

class StippledUnderline extends TextAttribute{
  static getName(){ return 'stippled_underline'; }
}

const derivedCtorsArr = [
  Underline,
  StippledUnderline,
];

const derivedCtorsObj = O.obj();
const instancesObj = O.obj();

for(const ctor of derivedCtorsArr){
  derivedCtorsObj[ctor.name] = ctor;
  instancesObj[ctor.getName()] = new ctor(null, kCtor);
}

module.exports = Object.assign(TextAttribute, derivedCtorsObj);