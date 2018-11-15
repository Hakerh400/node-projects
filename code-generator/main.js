'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const ffn = require('../ffn');
const gen = require('.');
const builtins = require('./builtins');

const outputFile = ffn('-dw/1.js');

setTimeout(main);

function main(){
  O.enhanceRNG();

  var builtinNames = O.keys(builtins);

  for(var i = 0;; i++){
    media.logStatus(i + 1, null, 'script');

    var source = gen(builtinNames).toString();
    var func = new Function(...builtinNames, source);

    var outs = [];
    var ok = .5;

    for(var j = 0; j !== 256; j++){
      global.input = j.toString(2);
      global.output = '';

      try{
        func(...builtinNames.map(name => builtins[name]));
      }catch(err){
        if(!(err instanceof RangeError || err instanceof SyntaxError)) throw err;
        ok = 0;
      }

      if(ok === 0) break;

      var out = global.output;
      var has = outs.includes(out);

      if(!has){
        outs.push(out);
        if(outs.length === 5){
          ok = 1;
          break;
        }
      }
    };

    if(ok === 1) break;
  };

  log();

  O.repeat(256, i => {
    var inp = i.toString(2);
    global.input = inp;
    global.output = '';
    func(...builtinNames.map(name => builtins[name]));
    log(`${inp} ---> ${global.output}`);
  });

  fs.writeFileSync(outputFile, source);
}