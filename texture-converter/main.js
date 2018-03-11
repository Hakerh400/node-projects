'use strict';

var textureConverter = require('.');

var input = null;
var output = '-img/1.png';

setTimeout(main);

function main(){
  textureConverter.convert(input, output, err => {
    if(err) return console.log(err);
    console.log('Finished.');
  });
}