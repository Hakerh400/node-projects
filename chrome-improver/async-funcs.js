'use strict';

var util = require('util');
var debug = require('./debug.js');

var waitTime = 30;

module.exports = {
  exec
};

function exec(funcs, args = [], cb = nop){
  var err = null;

  next();

  function next(){
    if(err || !funcs.length){
      return cb(err);
    }

    var func = funcs.shift();

    debug.verbose(`Calling ${getFuncName(func)} with arguments ${stringifyArgs(args)}.`);

    func(...args, e => {
      if(e){
        if(e instanceof Error){
          e = `${e.message}`;
        }

        err = `${e}`;
      }

      setTimeout(next, waitTime);
    });
  }
}

function getFuncName(func){
  if(func.name){
    return `"${func.name}"`;
  }else{
    return 'anonymous lambda';
  }
}

function stringifyArgs(args){
  return util.inspect(args);
}