'use strict';

const EventEmitter = require('events');
const O = require('../framework');

class Machine extends EventEmitter{
  constructor(compiled){
    super();

    this.obj = O.obj();
    this.compiled = compiled;
  }

  start(){
    setTimeout(() => {
      this.emit('exit');
    });
  }

  setProp(prop, val){
  }
};

module.exports = Machine;