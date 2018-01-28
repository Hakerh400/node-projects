'use strict';

var github = require('.');

var repo = process.argv[2];

setTimeout(main);

function main(){
  github.push(repo, err => {
    if(err) console.log(err);
  });
}