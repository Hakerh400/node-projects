'use strict';

var browserEncryptor = require('.');

var inputDir = '-wamp/projects/encrypted';
var outputDir = inputDir;

var password = '123';

setTimeout(main);

function main(){
  browserEncryptor.encrypt(inputDir, outputDir, password, err => {
    if(err) return console.log(err);
    console.log('Finished.');
  });
}