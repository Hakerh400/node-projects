'use strict';

var github = require('.');

var repo = process.argv[2] || 'node';

setTimeout(main);

function main(){
  github.push(repo, err => {
    if(err) console.log(err);
  });
}