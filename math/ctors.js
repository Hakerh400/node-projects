'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class Base extends O.Stringifiable{}

class System extends Base{
  typesArr = [];
  typesObj = O.obj();

  funcsArr = [];
  funcsObj = O.obj();

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

  hasFunc(name){
    return O.has(this.funcsObj, name);
  }

  getFunc(name){
    assert(this.hasFunc(name));
    return this.funcsObj[name];
  }

  addFunc(func){
    assert(func instanceof FuncDef);
    assert(func.cases.length !== 0);

    const {name} = func;
    assert(!this.hasFunc(name));

    this.funcsArr.push(func);
    this.funcsObj[name] = type;
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

  get arity(){ return this.args.length; }

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

  get isFunc(){
    if(this.name !== '->') return 0;
    assert(this.args.length === 2);
    return 1;
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

class FuncDef extends Base{
  cases = [];

  constructor(name, signature){
    super();

    assert(isFuncName(name));

    this.name = name;
    this.signature = signature;
  }

  addCase(fcase){
    const {name} = fcase;
    assert(name === this.name);
    this.cases.push(fcase);
  }

  toStr(){
    const {name, signature, cases} = this;
    const arr = [name, ' :: ', signature, '\n'];

    for(const fcase of cases)
      arr.push('\n', fcase);

    return arr;
  }
}

class FuncCase extends Base{
  args = [];
  expr = null;

  constructor(name){
    super();

    assert(isFuncName(name));
    this.name = name;
  }

  get arity(){ return this.args.length; }

  addArg(arg){
    this.args.push(arg);
  }

  setExpr(expr){
    assert(expr instanceof Expression);
    assert(this.expr === null);

    this.expr = expr;
  }

  toStr(){
    const {name, args, expr} = this;
    const arr = [name];

    for(const arg of args)
      arr.push(' ', arg);

    arr.push(' = ', expr);

    return arr;
  }
}

const isTypeName = str => {
  if(str === '->') return 1;
  return isCapitalized(str);
};

const isCtorName = str => {
  return isCapitalized(str);
};

const isFuncName = str => {
  return isIdentName(str)
};

const isIdentName = str => {
  return /^[a-z][a-zA-Z0-9]*$/.test(str);
};

const isCapitalized = str => {
  return /^[A-Z][a-zA-Z0-9]*$/.test(str);
};

module.exports = {
  Base,
  System,
  TypeDef,
  CtorDef,
  Type,
  FuncDef,
  FuncCase,

  isTypeName,
  isCtorName,
  isCapitalized,
};