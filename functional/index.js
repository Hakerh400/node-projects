'use strict';

const O = require('../framework');
const functional = require('../../Esolang/functional/src');

const {Machine} = functional;

const PROB = .8;
const PROB_LINES = PROB;
const PROB_PARENS = PROB;

module.exports = {
  ...functional,

  run,
  generate,
  compile,
  parse,
  normalize,
};

function run(src, input, IO=functional.io.IO){
  var machine = new Machine(src);
  var io = new IO(machine, input);
  var tick = machine.start(Infinity);

  while(!tick.next().done);
  if(machine.error) return 'err';

  return io.getOutput();
}

function generate(){
  var str = `${O.ca(9, i => i).join(', ')},\n\n`;

  var parens = 0;
  var mode = 0;

  var ffirst = 1;
  var first = 0;

  var hasWrite = 0;

  while(1){
    if(mode === 0){
      if(parens === 0){
        if(hasWrite && O.randf(1) < 1 - PROB_LINES) break;

        if(!ffirst) comma();
        ffirst = 0;

        str += ident();
        inc();
      }else{
        if(bit()){
          if(!first) comma();
          str += ident();
          mode = 1;
          first = 0;
        }else{
          dec();
        }
      }
    }else{
      if(bit()){
        inc();
        mode = 0;
      }else{
        mode = 0;
        first = 0;
      }
    }
  }

  return str;

  function inc(){
    str += '(';
    parens++;
    mode = 0;
    first = 1;
  }

  function dec(){
    str += ')';
    parens--;
    mode = 1;
    first = 0;
  }

  function comma(){
    var s = parens === 0 ? '\n' : ' ';
    str += `,${s}`;
  }

  function ident(){
    var id = O.rand(16);
    if(id === 7) hasWrite = 1;
    return id.toString(16).toUpperCase();
  }

  function bit(){
    return O.rand(2 + parens * (1 - PROB_PARENS)) === 0 | 0;
  }
}

function compile(src){
  var machine = new Machine(src);
  return machine.compiled;
}

function parse(compiled){
  var machine = new Machine(compiled);
  var str = machine.parsed.toString();
  str = str.substring(1, str.length - 1);
  return str;
}

function normalize(src){
  return parse(compile(src));
}