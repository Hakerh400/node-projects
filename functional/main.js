'use strict';

const GENERATE = 0;
const SAVE_COMPILED = 1;

const fs = require('fs');
const O = require('../framework');
const functional = require('.');
const IO = require('./io');

const {Machine} = functional;

setTimeout(main);

function main(){
  var inputs = O.ca(256, i =>{
    var str = (i + 1).toString(2).substring(1);
    str = str.split('').reverse().join('');
    return str;
  });

  if(GENERATE){
    while(1){
      var src = generate();
      var compiled = compile(src);
      var output = run(compiled, inputs[0]);

      var found = inputs.some(input => {
        return run(compiled, input) !== output;
      });

      if(found) break;
    }

    log(src);
  }else{
    var src = fs.readFileSync('src.txt', 'ascii');

    log(normalize(src));
  }

  var compiled = compile(src);

  var outputs = inputs.map(input => {
    return run(compiled, input);
  });

  log('');
  log(outputs.join(','));

  if(SAVE_COMPILED){
    fs.writeFileSync('compiled.hex', compiled);
  }
}

function run(src, input){
  var machine = new Machine(src);
  var io = new IO(machine, input);
  var tick = machine.start();

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
        if(hasWrite && O.rand(5) === 0) break;

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
    return O.rand(2 + parens * .2) === 0 | 0;
  }
}

function normalize(src){
  return parse(compile(src));
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