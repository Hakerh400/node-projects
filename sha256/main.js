'use strict';

var hash = require('../hash');
var sha256 = require('.');

var testStr = 'Test';

setTimeout(main);

function main(){
  var input = Buffer.from(testStr);
  var targetStr = hash(input, 'sha256').toString('hex');

  var output = sha256(input);
  var outputStr = output.toString('hex');

  console.log([targetStr, outputStr].join`\n\n`);
}