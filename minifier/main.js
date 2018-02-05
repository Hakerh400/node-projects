'use strict';

var minifier = require('.');

var input = 'C:/Users/Thomas/Downloads/www';
var output = 'C:/wamp/www';

setTimeout(main);

function main(){
  minifier.minify(input, output, err => {
    if(err) return console.log(err);
    console.log('Success.');
  });
}