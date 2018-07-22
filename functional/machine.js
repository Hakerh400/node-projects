'use strict';

const EventEmitter = require('events');
const O = require('../framework');
const debug = require('../debug');
const parser = require('./parser');

const {Identifier, List, CallChain} = parser;

const GeneratorFunction = function*(){}.constructor;
const Generator = function*(){}().constructor;

class Machine extends EventEmitter{
  constructor(compiled){
    super();

    var m = this;
    GeneratorFunction.prototype.toString = function(){
      return `func*[${m.funcs.indexOf(this)}]`;
    };

    this.compiled = compiled;

    this.funcs = [
      function*(cbInfo){
        yield cbInfo.evalArgs();
        cbInfo.ret(cbInfo.getArg(1));
      },

      function*(cbInfo){
        yield cbInfo.evalArgs();
        cbInfo.ret(cbInfo.getArg(0));
      },
    ];

    this.stack = createStack(compiled);
  }

  start(){
    var idents = O.obj();
    this.funcs.forEach((func, index) => idents[index] = func);
    var cbInfo = new CallbackInfo(this, idents, new List());

    var {stack} = this;
    var cbInfos = [cbInfo];

    while(stack.length !== 0){
      debug(stack.join('\n'));

      var len1 = stack.length - 1;
      var cbInfo = cbInfos[cbInfos.length - 1];

      var elem = stack[len1];

      log(elem.constructor === GeneratorFunction);
      log(elem.constructor === Generator);

      if(elem instanceof List){
        if(elem.arr.length === 0){
          stack[len1] = this.funcs[0];
          continue;
        }

        stack[len1] = new ValuesList(elem.arr.slice());
      }else if(elem instanceof CallChain){
        var func = cbInfo.getIdent(elem.ident.name);

        if(elem.arr.length === 0){
          stack[len1] = func;
          continue;
        }

        stack[len1] = new CallsList(func, elem.arr.slice());
      }else if(elem instanceof CallsList){
        if(elem.evald){
          stack[len1 - 1].setEvald(stack.pop().func);
          continue;
        }

        var args = elem.nextNonEvald();
        var cbInfoNew = new CallbackInfo(this, idents, args);

        var gen = elem.func(cbInfoNew);
        stack.push(gen);
      }else if(elem instanceof ValuesList){
        if(!elem.evald){
          stack.push(elem.nextNonEvald());
          continue;
        }

        throw 1;
      }else if(elem instanceof GeneratorFunction){
        stack[len1 - 1].setEvald(stack.pop());
      }else if(elem instanceof Generator){
        throw 2;
      }else{
        throw 0;
      }
    }

    setTimeout(() => {
      this.emit('exit');
    });
  }

  addFunc(func){
    this.funcs.push(func);
  }
};

class CallbackInfo{
  constructor(machine, idents, args){
    this.machine = machine;
    this.idents = idents;
    this.args = args;
    this.retVal = machine.funcs[0];
  }

  getIdent(id){
    var {idents} = this;
    if(!(id in idents)) return this.machine.funcs[0];
    return idents[id];
  }

  evalArgs(){
    this.machine.eval(this.idents, this.args);
  }

  getArg(index){
    var {args} = this;
    var valid = index >= 0 && index < args.length;

    if(!(args instanceof ValuesList)){
      if(!valid) return null;

      var callChain = args[index];

      if(callChain.arr.length !== 0) return null;
      return callChain.ident.name;
    }

    if(!valid) return this.machine.funcs[0];
    return args[index];
  }

  ret(val){
    this.retVal = val;
  }
};

class ValuesList{
  constructor(arr=[]){
    this.arr = arr;
    this.evaldIndex = 0;
    this.evald = arr.length === 0;
  }

  static from(list){
    var arr = list.arr.slice();
    return new ValuesList(arr);
  }

  nextNonEvald(){
    return this.arr[this.evaldIndex];
  }

  setEvald(func){
    var {arr} = this;

    arr[this.evaldIndex++] = func;

    if(this.evaldIndex === arr.length)
      this.evald = 1;
  }

  toString(){
    return `ValuesList: ${this.arr.join(',')}`;
  }
};

class CallsList extends ValuesList{
  constructor(func, arr=[]){
    super(arr);

    this.func = func;
  }

  toString(){
    return `CallsList: ${this.func}${this.arr.join('')}`;
  }
};

module.exports = Machine;

function createStack(compiled){
  var {Identifier, List, CallChain} = parser;

  var bs = new O.BitStream(compiled);
  var identsNum = 0;

  var stack = [new List()];
  var first = 0;

  while(1){
    var elem = top();

    if(first){
      first = 0;
    }else{
      var bit = rb();

      if(bit === 0){
        if(stack.length === 1)
          break;

        var elem = stack.pop();
        top().push(elem);

        continue;
      }
    }

    if(elem.isList()){
      var id;

      if(identsNum === 0 || rb()) id = identsNum++;
      else id = bs.read(identsNum - 1);

      var ident = new Identifier(id);
      var call = new CallChain(ident);

      stack.push(call);
    }else{
      stack.push(new List());
    }
  }

  return stack;

  function top(){
    return stack[stack.length - 1];
  }

  function rb(){
    return bs.readBit();
  }
}