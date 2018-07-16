'use strict';

const EventEmitter = require('events');
const O = require('../framework');

class Machine extends EventEmitter{
  constructor(compiled){
    super();

    this.parsed = compiled.parsed;
    this.compiled = compiled;

    this.global = O.obj();
  }

  start(){
    setTimeout(() => {
      this.emit('exit');
    });
  }

  setProp(prop, val){
  }
};

class Function{
  constructor(func){
    this.func = func;
  }

  getFunc(){ return this.func; }

  isNative(){ return false; };
  isLvalue(){ return false; };
};

class NativeFunction extends Function{
  constructor(func){
    super(func);
  }

  call(cbInfo){
    return this.func(cbInfo);
  }

  isNative(){ return true; }
};

class UserFunction extends Function{
  constructor(func){
    super(func);
  }

  call(cbInfo){
    return this.func(cbInfo);
  }
};

class Lvalue extends Function{
  constructor(func){
    super(func);
  }

  assign(func){ return this.func = func; }
  call(cbInfo){ return this.func(cbInfo); }

  isLvalue(){ return false; };
};

module.exports = Machine;