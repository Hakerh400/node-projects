'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Demo{
  constructor(name, func){
    this.name = name;
    this.func = func;
  }
}

module.exports = Demo;