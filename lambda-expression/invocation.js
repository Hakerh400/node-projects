'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');

class Invocation extends Element{
  static type = 2;

  constructor(elem1=null, elem2=null){
    super();
    
    this.elem1 = elem1;
    this.elem2 = elem2;
  }

  toString(nest=0){
    const {elem1, elem2} = this;
    let str = '';

    for(let i = 0; i !== 2; i++){
      const elem = i === 0 ? elem1 : elem2;

      switch(elem.type){
        case 0:
          str += elem.toString(nest);
          break;

        case 1:
          str += `(${elem.toString(nest)})`;
          break;

        case 2:
          if(i === 0) str += elem.toString(nest);
          else str += `(${elem.toString(nest)})`;
          break;
      }
    }

    return str;
  }
}

module.exports = Invocation;