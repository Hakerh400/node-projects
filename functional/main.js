'use strict';

const GENERATE = 1;
const SAVE_TEMP_FILES = 0;
const REPEAT = 1;

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
  while(1){
    var src, inputs;

    if(GENERATE){
      inputs = O.ca(256, i =>{
        var str = (i + 1).toString(2).substring(1);
        str = str.split('').reverse().join('');
        return str;
      });

      while(1){
        src = generate();

        var compiled = compile(src);
        var output = run(compiled, inputs[0], IO);

        var found = inputs.some(input => {
          return run(compiled, input, IO) !== output;
        });

        if(found) break;
      }

      log(O.sanl(src).slice(2).join('\n'));
    }else{
      src = O.buff2ascii(fs.readFileSync('src.txt'));
      
      var input = fs.readFileSync('input.txt');
      if(IO === functional.io.IOBit)
        input = O.buff2ascii(input);

      inputs = [input];

      log(normalize(src));
    }

    var compiled = compile(src);

    var outputs = inputs.map(input => {
      return run(compiled, input, IO);
    });

    log('');
    log(outputs.join(','));

    if(SAVE_TEMP_FILES){
      var temp = functional.tokenizer.tokenize(src);
      fs.writeFileSync('tokenized.txt', temp);

      temp = functional.parser.parse(temp);
      fs.writeFileSync('parsed.txt', temp);

      temp = functional.compiler.compile(temp);
      fs.writeFileSync('compiled.hex', temp);
    }

    if(!REPEAT)
      break;

    debug('');
  }
}