'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const InterpreterBase = require('../../interpreter-base');

const IDENTS_NUM = 7;

class Interpreter extends InterpreterBase{
  static identsNum = IDENTS_NUM;

  constructor(g, script){
    super(g, script);
    if(g.dsr) return;
  }
}

class List extends SG.Node{
  static ptrsNum = this.keys(['ident', 'arg', 'next']);

  constructor(g, ident=null, arg=null, next=null){
    super(g, ident);
    if(g.dsr) return;

    this.ident = ident;
    this.arg = arg;
    this.next = next;
  }

  static from(list){ return new this(this.ident, this.arg, this.next); }
  clone(){ return this.constructor.from(this); }
  from(list){ this.ident = list.ident; this.arg = list.arg; this.next = list.next; return this; }
  copy(list){ list.ident = this.ident; list.arg = this.arg; list.next = this.next; return list; }
}

class Argument extends SG.Node{
  static ptrsNum = this.keys(['list', 'next']);

  constructor(g, list=null, next=null){
    super(g, list);
    if(g.dsr) return;

    this.list = list;
    this.next = next;
  }

  static from(list){ return new this(this.list, this.next); }
  clone(){ return this.constructor.from(this); }
  from(list){ this.list = list.list; this.next = list.next; return this; }
  copy(list){ list.list = this.list; list.next = this.next; return list; }
}

class Invocation extends cgs.Function{
  static ptrsNum = this.keys(['closure', 'args']);

  constructor(g, closure=null, args=null){
    super(g, ident);
    if(g.dsr) return;

    this.closure = closure;
    this.args = args;
    this.idents = null;

    this.keepAll = keepAll;
    this.evald === args === null;
  }

  ser(s){
    super.ser(s);
    s.write(this.evald);
  }

  deser(s){
    super.deser(s);
    this.evald = s.read();
  }

  tick(th){
    const {closure} = this;

    if(!this.evald){
      return;
    }
  }
}

const ctorsArr = [
  List,
  Argument,
  Invocation,
];

const ctorsObj = O.obj();
for(const ctor of ctorsArr)
  ctorsObj[ctor.name] = ctor;

module.exports = Object.assign(Interpreter, {
  ctorsArr,
  ctorsObj,
});

const Parser = require('./parser');
const Compiler = require('./compiler');

Interpreter.Parser = Parser;
Interpreter.Compiler = Compiler;