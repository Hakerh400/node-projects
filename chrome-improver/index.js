'use strict';

var intface = require('./interface.js');
var errors = require('./errors.js');

setTimeout(main);

function main(){
  process.on('uncaughtException', onUncaughtException);

  intface.create(err => {
    if(err) errors.fatal(err);
  });
}

function onUncaughtException(err){
  errors.fatal(err);
}