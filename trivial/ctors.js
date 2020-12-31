'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const arrOrder = require('../arr-order');

const lower = O.chars('a', 'z');
const upper = O.chars('A', 'Z');

class Base extends O.Stringifiable{}

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
  constructor(id, args=[], expr=null, funcs=[]){
    super();

    this.id = new FunctionID(id);
    this.args = args;
    this.expr = expr;
    this.funcs = funcs;
  }

  addArg(arg){
    this.args.push(arg);
  }

  setExpr(expr){
    assert(this.expr === null);
    this.expr = expr;
  }

  addFunc(func){
    this.funcs.push(func);
  }

  toStr(){
    const arr = [this.id, '('];

    this.join(arr, this.args, ', ');
    arr.push('){', this.inc, '\n');
    arr.push(this.expr);

    for(const func of this.funcs)
      arr.push('\n\n', this.func);

    arr.push(this.dec, '}');
    return arr;
  }
}

class Expression extends Base{}

class Reference extends Expression{}

class ArgumentRef extends Reference{
  constructor(arg){
    super();
    this.arg = arg;
  }

  toStr(){
    return this.arg.id;
  }
}

class FunctionRef extends Reference{
  constructor(func){
    super();
    this.func = func;
  }

  toStr(){
    return this.func.id;
  }
}

class Call extends Expression{
  constructor(target, args=[]){
    super();

    this.target = target;
    this.args = args;
  }

  addArg(arg){
    this.args.push(arg);
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