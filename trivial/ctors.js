'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const arrOrder = require('../arr-order');

const lower = O.chars('a', 'z');
const upper = O.chars('A', 'Z');

class Base extends O.Stringifiable{
  argRefs = new Set();
  funcRefs = new Set();

  hasArgRef(arg){
    return arg in this.argRefs;
  }

  hasFuncRef(func){
    return func in this.funcRefs;
  }

  addArgRef(arg){
    this.argRefs.add(arg);
    return this;
  }

  addFuncRef(func){
    this.funcRefs.add(func);
    return this;
  }

  copyRefs(other){
    const {argRefs, funcRefs} = this;

    for(const arg of other.argRefs)
      argRefs.add(arg);

    for(const func of other.funcRefs)
      funcRefs.add(func);

    return this;
  }
}

class Program extends Base{
  constructor(expr, funcs=[]){
    super();

    this.expr = expr;
    this.funcs = [];

    for(const func of funcs)
      this.addFunc(func);
  }

  addFunc(func){
    this.funcs.push(func);
    return this.copyRefs(func);
  }

  toStr(){
    const arr = [this.expr];

    for(const func of this.funcs)
      arr.push('\n\n', func);

    return arr;
  }
}

class Identifier extends Base{
  constructor(id){
    super();
    this.id = id;
  }

  get chars(){ O.virtual('chars'); }

  toStr(){
    return arrOrder.str(this.chars, this.id + 1);
  }
}

class ArgumentID extends Identifier{
  get chars(){ return upper; }
}

class FunctionID extends Identifier{
  get chars(){ return lower; }
}

class Argument extends Base{
  used = 0;

  constructor(id, first=0){
    super();

    this.id = new ArgumentID(id);
    this.first = first;
  }

  toStr(){
    return this.id;
  }
}

class Function extends Base{
  parent = null;

  constructor(id, args=[], expr=null, funcs=[]){
    super();

    this.id = new FunctionID(id);
    this.args = [];
    this.expr = null;
    this.funcs = [];

    for(const arg of args)
      this.addArg(arg);

    if(expr !== null)
      this.setExpr(expr);

    for(const func of funcs)
      this.addfunc(arg);
  }

  addArg(arg){
    this.args.push(arg);
    return this.copyRefs(arg);
  }

  setExpr(expr){
    assert(this.expr === null);

    this.expr = expr;
    return this.copyRefs(expr);
  }

  addFunc(func){
    assert(func.parent === null);

    this.funcs.push(func);
    func.parent = this;

    return this.copyRefs(func);
  }

  toStr(){
    const arr = [this.id, '('];

    this.join(arr, this.args, ', ');
    arr.push('){', this.inc, '\n');
    arr.push(this.expr);

    for(const func of this.funcs)
      arr.push('\n\n', func);

    arr.push(this.dec, '\n}');
    return arr;
  }
}

class Expression extends Base{}

class Reference extends Expression{}

class ArgumentRef extends Reference{
  constructor(arg){
    super();

    this.arg = arg;
    this.argRefs.add(arg);

    arg.used = 1;
  }

  toStr(){
    return this.arg.id;
  }
}

class FunctionRef extends Reference{
  constructor(func){
    super();

    this.func = func;
    this.funcRefs.add(func);
  }

  toStr(){
    return this.func.id;
  }
}

class Call extends Expression{
  constructor(target, args=[]){
    super();

    this.target = target;
    this.args = [];

    this.copyRefs(target);

    for(const arg of args)
      this.addArg(arg);
  }

  addArg(arg){
    this.args.push(arg);
    return this.copyRefs(arg);
  }

  toStr(){
    if(this.args.length === 0)
      return this.target;

    const arr = [this.target, '('];

    this.join(arr, this.args, ', ');
    arr.push(')');

    return arr;
  }
}

module.exports = {
  Base,
  Program,
  Identifier,
  ArgumentID,
  FunctionID,
  Argument,
  Function,
  Expression,
  Reference,
  ArgumentRef,
  FunctionRef,
  Call,
};