'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');

const valTypes = O.enum([
  'ATTRIBUTE',
  'METHOD',
  'CONSTRUCTOR',
]);

class Class{
  constructor(name, ext=null){
    this.name = name;
    this.ext = ext;

    this.attribs = O.obj();
    this.methods = O.obj();
    this.smethods = O.obj();
    this.ctor = null;
  }

  hasAttrib(name){
    return name in this.attribs;
  }

  addAttrib(attrib){
    this.attribs[attrib.name] = attrib;
  }

  hasCtor(){
    return this.ctor !== null;
  }

  setCtor(ctor){
    this.ctor = ctor;
  }

  setDefaultCtor(){
    this.ctor = new Method(this);
  }

  hasMethod(name, isStatic=0){
    if(isStatic) return name in this.smethods;
    else return name in this.methods;
  }

  addMethod(method){
    if(method.isStatic) this.smethods[method.name] = method;
    else this.methods[method.name] = method;
  }
}

class Method{
  constructor(cref, name=null, type=cref.name, args=[], isStatic=0){
    this.class = cref;
    this.name = name;
    this.type = type;
    this.args = args;
    this.isStatic = isStatic;

    this.isCtor = name === null;
    this.isNative = 0;
    this.nativeFunc = null;

    this.idents = O.arr2obj(args.map(a => a.name), null);
  }

  setNativeFunc(func){
    this.isNative = 1;
    this.nativeFunc = func;
  }

  hasIdent(name){
    return name in this.idents;
  }

  setIdent(name, val){
    this.idents[name] = val;
  }
}

class Identifier{
  constructor(name, type){
    this.name = name;
    this.type = type;
  }
}

class Object{
  constructor(cref){
    this.class = cref;
    this.nativeData = null;
  }
}

module.exports = {
  valTypes,

  Class,
  Method,
  Identifier,
  Object,
};