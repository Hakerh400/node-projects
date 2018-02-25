'use strict';

var O = require('../framework');
var browserEncryptor = require('.');

var inputDir = '-encrypted';
var outputDir = '-wamp/projects/encrypted';

var password = O.passwords[1];
password = '';

setTimeout(main);

function main(){
  browserEncryptor.encrypt(inputDir, outputDir, password, err => {
    if(err) return console.log(err);
    console.log('Finished.');
  });
}