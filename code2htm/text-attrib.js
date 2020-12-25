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

  static isTypeSupported(type){
    return type in instancesObj;
  }

  static getType(type){
    assert(this.isTypeSupported(type));
    return instancesObj[type];
  }
}

class Underline extends TextAttribute{
  static getName(){ return 'underline'; }
}

class StippledUnderline extends TextAttribute{
  static getName(){ return 'stippled_underline'; }
}

class Italic extends TextAttribute{
  static getName(){ return 'italic'; }
}

class Bold extends TextAttribute{
  static getName(){ return 'bold'; }
}

const derivedCtorsArr = [
  Underline,
  StippledUnderline,
  Italic,
  Bold,
];

const derivedCtorsObj = O.obj();
const instancesObj = O.obj();

for(const ctor of derivedCtorsArr){
  derivedCtorsObj[ctor.name] = ctor;
  instancesObj[ctor.getName()] = new ctor(null, kCtor);
}

module.exports = Object.assign(TextAttribute, derivedCtorsObj);