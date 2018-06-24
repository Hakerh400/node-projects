'use strict';

var github = require('.');

var repo = process.argv[2] || 'io';

setTimeout(main);

function main(){
  github.push(repo, err => {
    if(err) return log(err);
    log('Finished.');
  });
}