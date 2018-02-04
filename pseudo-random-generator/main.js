'use strict';

var PseudoRandomGenerator = require('.');

var mainSeed = 'ABC123';

setTimeout(main);

function main(){
  var gen = new PseudoRandomGenerator(mainSeed);

  gen.setSeed('dd');

  console.log(gen.rand(100));
  console.log(gen.rand(100));
  console.log(gen.rand(100));

  gen.setSeed('pk');

  console.log('');
  console.log(gen.rand(100));
  console.log(gen.rand(100));
  console.log(gen.rand(100));

  gen.setSeed('dd');

  console.log('');
  console.log(gen.rand(100));
  console.log(gen.rand(100));
  console.log(gen.rand(100));
}