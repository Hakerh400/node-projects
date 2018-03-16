'use strict';

var O = require('../framework');
var nativeClasses = require('./native-classes');

class Program{
  constructor(code){
    this.code = code;
  }

  exec(){
    return 'test';
  }
};

module.exports = {
  Program,
  compile,
};

function compile(src){
  src = O.sanl(src).join`\n`;

  return new Program();
}