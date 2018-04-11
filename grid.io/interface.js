'use strict';

var readline = require('readline');
var EventEmitter = require('events');
var O = require('../framework');

class Interface extends EventEmitter{
  constructor(){
    super();

    this.rl = readline.createInterface(process.stdin, process.stdout);
    this.onDataFunc = this.onData.bind(this);
    this.rl.on('line', this.onDataFunc);
  }

  onData(str){
    this.emit('data', str);
  }

  close(){
    this.rl.close();
  }
};

module.exports = Interface;