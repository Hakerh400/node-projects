'use strict';

const EventEmitter = require('events');
const O = require('../framework');
const {Machine: _Machine} = require('./addon/build/Release/addon.node');

class Machine extends EventEmitter{
  constructor(src, input){
    super();

    var machine = new _Machine(src, input);
    this._machine = machine;

    machine.emit = this.emit.bind(this);
  }

  start(){
    this._machine.start();
  }

  getOutput(){
    return this._machine.getOutput();
  }
};

module.exports = {
  Machine,
};