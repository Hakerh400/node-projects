'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');

const TAB_SIZE = 2;

class Base extends O.Stringifiable{}

class Program extends Base{
  base = null;
  funcs = [];

  toStr(){
    const {base, funcs} = this;
    const arr = [base];

    for(const func of funcs)
      arr.push('\n\n', func);

    return arr;
  }
}

class Type extends Base{
  constructor(parent, name){
    super();

    this.parent = parent;
    this.name = name;

    this.attrs = [];
    this.exts = [];

    this.depth = parent !== null ? parent.depth + 1 : 0;
  }

  toStr(){
    const {parent, name, attrs, exts, depth} = this;
    const arr = [name];

    if(attrs.length !== 0)
      arr.push(`(${attrs.map(a => a.name).join(', ')})`)

    if(exts.length !== 0){
      arr.push('{\n');
      for(const ext of exts)
        arr.push(tab(depth + 1), ext, ',\n');
      arr.push(tab(depth, '}'));
    }

    return arr;
  }
}

class Function extends Base{
  constructor(name, args, ret){
    super();

    this.name = name;
    this.args = args;
    this.ret = ret;

    this.expr = null;
  }

  toStr(){
    const {name, args, ret, expr} = this
    return [`${ret.name} ${name}(${args.map(a => a.name).join(', ')}): `, /*expr*/'...'];
  }
}

class Expression extends Base{
  parent = null;

  get depth(){
    let expr = this;
    let depth = 0;

    while(expr.parent !== null){
      expr = expr.parent;
      depth++;
    }

    return depth;
  }
}

class Invocation extends Expression{
  constructor(name){
    super();

    this.name = name;
    this.args = [];
  }

  addArg(arg){
    this.args.push(this);
    arg.parent = this;
  }

  toStr(){
    const {args, depth} = this;
    const arr = [this.name];

    arr.push('(\n');
    for(const arg of args)
      arr.push(tab(depth + 1), arg, ',\n');
    arr.push(tab(depth, ')'));
  }
}

class Argument extends Expression{
  constructor(name){
    super();

    this.name = name;
  }

  toStr(){
    return this.name;
  }
}

const tab = (num=1, str='') => {
  return `${' '.repeat(TAB_SIZE * num)}${str}`;
};

module.exports = {
  Base,
  Program,
  Type,
  Function,
  Expression,
  Invocation,
  Argument,
};