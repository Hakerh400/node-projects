'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class Pattern{
  static id = 0;
  id = Pattern.id++;

  constructor(){
    this.elems = [];
  }

  addElem(elem){ this.elems.push(elem); }
  len(){ this.elems.length; }
};

module.exports = Pattern;