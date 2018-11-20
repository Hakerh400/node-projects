'use strict';

const github = require('.');

const repo = getRepo();

setTimeout(main);

function main(){
  github.push(repo, err => {
    if(err) return log(err);
    log('Finished.');
  });
}

function getRepo(){
  var args = process.argv.slice(2);

  if(args.length !== 1)
    throw new TypeError('Expected exactly 1 command line argument');

  return args[0];
}