'use strict';

var github = require('.');

var repo = 'javascript';

setTimeout(main);

function main(){
  github.push(repo, err => {
    if(err) console.log(err);
  });
}