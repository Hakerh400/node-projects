'use strict';

var minifier = require('.');

var input = 'C:/wamp/www1';
var output = 'C:/wamp/www';

setTimeout(main);

function main(){
  minifier.minify(input, output, err => {
    if(err) return log(err);
    log('Finished.');
  });
}