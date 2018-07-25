'use strict';

const EventEmitter = require('events');
const O = require('../framework');
const debug = require('../debug');
const parser = require('./parser');

const {Identifier, List, CallChain} = parser;

class Machine extends EventEmitter{
  constructor(compiled){
    super();

    this.compiled = compiled;
    this.stack = createStack(compiled);

    var m = this;
    Function.prototype.toString = function(){
      return `func[${m.funcs.indexOf(this)}]`;
    };

    this.funcs = [
      cbInfo => {
        if(!cbInfo.isEvald()) return cbInfo.eval();
        return cbInfo.getArg(1);
      },

      cbInfo => {
        if(!cbInfo.isEvald()) return cbInfo.eval();
        return cbInfo.getArg(0);
      },
    ];
  }

  start(){
    var {funcs, stack} = this;

    var idents = O.obj();

    this.funcs.forEach((func, index) => {
      idents[index] = func;
    });

    mainLoop: while(stack.length !== 0){
      var elem = stack[stack.length - 1];

      if(elem instanceof EvalList){
        while(!elem.evald){
          var e = elem.get();
          var func = funcs[e.ident.name];

          if(e.arr.length === 0){
            elem.set(func);
            continue;
          }

          stack.push(new EvalCallChain(func, e.arr.slice()));
          continue mainLoop;
        }

        stack.pop();

        if(!elem.reduce)
          stack[stack.length - 1].set(elem);

        continue;
      }

      if(elem instanceof EvalCallChain){
        if(elem.evald){
          stack.pop();
          stack[stack.length - 1].set(elem.func);
          continue;
        }

        var func = elem.func;
        var args = new EvalList(elem.get().arr.slice());
        var cbInfo = new CallbackInfo(func, idents, args);

        stack.push(cbInfo);
        
        continue;
      }

      if(elem instanceof CallbackInfo){
        var result = elem.call();
        if(result === null) continue;

        if(result instanceof Function){
          stack[stack.length - 1] = result;
          continue;
        }

        stack.push(result);

        continue;
      }

      if(elem instanceof Function){
        stack.pop();
        stack[stack.length - 1].set(elem);
        continue;
      }
    }

    this.emit('exit');
  }

  addFunc(func){
    this.funcs.push(func);
  }
};

class EvalList{
  constructor(arr, reduce=0){
    this.arr = arr;
    this.reduce = reduce;
    this.index = 0;
    this.evald = arr.length === 0;
  }

  get(){
    return this.arr[this.index];
  }

  set(val){
    var {arr} = this;

    if(this.reduce){
      arr.shift();
      this.evald = arr.length === 0;
    }else{
      arr[this.index++] = val;
      this.evald = this.index === arr.length;
    }
  }

  toString(){
    return this.arr.join(',');
  }
};

class EvalCallChain{
  constructor(func, arr){
    this.func = func;
    this.arr = arr;
    this.evald = arr.length === 0;
  }

  get(){
    return this.arr[0];
  }

  set(val){
    this.func = val;
    this.arr.shift();
    this.evald = this.arr.length === 0;
  }

  toString(){
    return `${this.func}${this.arr.join('')}`;
  }
};

class CallbackInfo{
  constructor(func, idents, args){
    this.func = func;
    this.idents = idents;
    this.args = args;
  }

  call(){
    var result = this.func(this);
    if(result == null) return this.idents[0];
    return result;
  }

  isEvald(){
    return this.args.evald;
  }

  eval(){
    return this.args;
  }

  set(evaldList){
    this.args = evaldList;
  }

  getArg(index){
    var {arr} = this.args;

    if(index < 0 || index >= arr.length)
      return this.idents[0];

    return arr[index];
  }

  getIdent(id){
    var {idents} = this;
    if(!(id in idents)) return idents[0];
    return idents[id];
  }

  toString(){
    return `CBINFO: ${this.func}(${this.args})`;
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

  return [new EvalList(stack[0].arr, 1)];

  function top(){
    return stack[stack.length - 1];
  }

  function rb(){
    return bs.readBit();
  }
}