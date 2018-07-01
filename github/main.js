'use strict';

var github = require('.');

var repo = getRepo();

setTimeout(main);

function main(){
  github.push(repo, err => {
    if(err) return log(err);
    log('Finished.');
  });
}

function getRepo(){
  var args = process.argv;

  if(args.length !== 3)
    throw new TypeError('Expected exactly 1 command line argument');

  return args[2];
}