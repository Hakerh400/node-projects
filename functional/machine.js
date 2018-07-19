'use strict';

const EventEmitter = require('events');
const O = require('../framework');

class Machine extends EventEmitter{
  constructor(compiled){
    super();

    this.compiled = compiled;
    this.list = compiled.parsed.list;

    this.global = {
      eq(args){
        args.eval();
        return args.get(0).eq(args.get(1));
      },

      assign(args){
        var ident = agrs.get(0);
        if(!ident.isLvalue()) return;
        return ident.assign(args.eval(1));
      },

      func(args){
        if(!args.areLvalues()) return;

        return args1 => {
          args1.idents = idents;

          return args2 => {
            args2.eval();
          };
        };
      },
    };
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