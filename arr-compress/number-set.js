'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

class NumberSet{
  obj = O.obj();
  size = 0;
  last = null;

  constructor(iterable=null){
    if(iterable !== null)
      for(const num of iterable)
        this.add(num);
  }

  has(num){
    return num in this.obj;
  }

  add(num){
    assert(!this.has(num));

    this.obj[num] = 1;
    this.size++;
    this.last = num;
  }

  delete(num){
    assert(this.has(num));

    delete this.obj[num];
    this.size--;
  }
}

module.exports = NumberSet;