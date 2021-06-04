'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base extends O.Stringifiable{}

class System extends Base{
  typesArr = [];
  typesObj = O.obj();

  hasType(name){
    return O.has(this.typesObj, name);
  }

  getType(name){
    assert(this.hasType(name));
    return this.typesObj[name];
  }

  addType(type){
    assert(type instanceof TypeDef);

    const {name} = type;
    assert(!this.hasType(name));

    this.typesArr.push(type);
    this.typesObj[name] = type;
  }
}

class TypeDef extends Base{
  ctorsArr = [];
  ctorsObj = O.obj();

  constructor(name){
    super();

    assert(isTypeName(name));
    this.name = name;
  }

  hasCtor(name){
    return O.has(this.ctorsObj, name);
  }

  getCtor(name){
    assert(this.hasCtor(name));
    return this.ctorsObj[name];
  }

  addCtor(ctor){
    const {name} = ctor;
    assert(!this.hasCtor(name));

    this.ctorsArr.push(ctor);
    this.ctorsObj[name] = ctor;
  }

  toStr(){
    const {name, ctorsArr} = this;
    const ctorsNum = ctorsArr.length;

    assert(ctorsNum !== 0);

    const arr = ['data ', name, ' ='];

    if(ctorsNum === 1){
      arr.push(' ', ctorsArr[0]);
      return arr;
    }

    arr.push(this.inc);

    for(let i = 0; i !== ctorsNum; i++){
      const ctor = ctorsArr[i];

      arr.push('\n', ctor);

      if(i !== ctorsNum - 1)
        arr.push(' |');
    }

    arr.push(this.def);

    return arr;
  }
}

class CtorDef extends Base{
  args = [];

  constructor(name){
    super();

    assert(isCtorName(name));
    this.name = name;
  }

  addArg(arg){
    this.args.push(arg);
  }

  toStr(){
    const {name, args} = this;
    const arr = [name];

    for(const arg of args)
      arr.push(' ', arg);

    return arr;
  }
}

class Type extends Base{
  args = [];

  constructor(name){
    super();

    assert(isTypeName(name));
    this.name = name;
  }

  addArg(arg){
    this.args.push(arg);
  }

  toStr(){
    const {name, args} = this;
    const arr = [name];

    for(const arg of args)
      arr.push(' ', arg);

    return arr;
  }
}

const isTypeName = str => {
  return isCapitalized(str);
};

const isCtorName = str => {
  return isCapitalized(str);
};

const isCapitalized = str => {
  return /^[A-Z][a-z0-9]*$/.test(str);
};

module.exports = {
  Base,
  System,
  TypeDef,
  CtorDef,
  Type,

  isTypeName,
  isCtorName,
  isCapitalized,
};