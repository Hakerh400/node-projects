'use strict';

const GENERATE = 0;
const REPEAT = 0;
const SAVE_COMPILED = 0;

const fs = require('fs');
const O = require('../framework');
const debug = require('../debug');
const functional = require('.');

const {
  run,
  generate,
  compile,
  parse,
  normalize,
} = functional;

const IO = functional.io.IOBit;

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
      var output = run(compiled, inputs[0], IO);

      var found = inputs.some(input => {
        return run(compiled, input, IO) !== output;
      });

      if(found) break;
    }

    log(O.sanl(src).slice(2).join('\n'));
  }else{
    var src = fs.readFileSync('src.txt', 'ascii');

    log(normalize(src));
  }

  var compiled = compile(src);

  var outputs = inputs.map(input => {
    return run(compiled, input, IO);
  });

  log('');
  log(outputs.join(','));

  if(SAVE_COMPILED){
    fs.writeFileSync('compiled.hex', compiled);
  }

  if(REPEAT){
    debug('');
    setTimeout(main, 1e3);
  }
}