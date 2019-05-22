'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class Definition extends Element{
  static type = 1;

  constructor(elem=null){
    super();
    
    this.elem = elem;
  }

  toString(nest=0){
    const {elem} = this;
    const id = this.getId(nest);

    switch(elem.type){
      case 0:
        return `${id}.${elem.toString(nest + 1)}`;
        break;

      case 1:
        return `${id}${elem.toString(nest + 1)}`;
        break;

      case 2:
        return `${id}.${elem.toString(nest + 1)}`;
        break;
    }
  }
}

module.exports = Definition;