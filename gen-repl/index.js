const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Repl{
  #ctx = createCtx();

  eval(code){
    return this.#ctx.next(code).value;
  }
}

const createCtx = () => {
  const ctx = ctxGen();
  ctx.next();
  return ctx;
};

const ctxGen = function*(){
  let val;

  while(1)
    val = eval(yield val);
};

module.exports = Repl;