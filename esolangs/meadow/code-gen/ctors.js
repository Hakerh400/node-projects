'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');

const TAB_SIZE = 2;

class Type extends O.Stringifiable{
  constructor(parent, name){
    super();

    this.parent = parent;
    this.name = name;

    this.attrs = [];
    this.exts = [];

    this.depth = parent !== null ?
      parent.depth + 1 : 0;
  }

  toStr(){
    const {parent, name, attrs, exts, depth} = this;
    const arr = [name];

    if(attrs.length !== 0)
      arr.push(`(${attrs.map(a => a.name).join(', ')})`)

    if(exts.length !== 0){
      arr.push('{\n');
      for(const ext of exts)
        arr.push(tab(depth + 1), ext, ',\n');
      arr.push(tab(depth, '}'));
    }

    return arr;
  }
}

const tab = (num, str='') => {
  return `${' '.repeat(TAB_SIZE * num)}${str}`;
};

module.exports = {
  Type,
};