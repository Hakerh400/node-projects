'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Pointer = require('./pointer');

class Node{
  constructor(name, ptrs=[]){
    this.name = String(name);
    this.ptrs = ptrs;
  }

  addPtr(node, cost){
    this.ptrs.push(new Pointer(node, cost));
  }

  addPtrs(ptrs){
    for(let i = 0; i !== ptrs.length; i += 2)
      this.addPtr(ptrs[i], ptrs[i + 1]);
  }
}

module.exports = Node;