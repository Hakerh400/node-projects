'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');

setTimeout(main);

function main(){
  var depth = 10;
  var num = (1 << depth) - 1;

  var tree = Tree.create(depth);
  var arr1 = O.ca(num, i => i);
  var arr2 = [];

  O.repeat(num, i => tree.set(i, i));
  tree.preorder(a => arr2.push(a));

  log(arr1.toString() === arr2.toString());
}

class Tree{
  constructor(depth, v=null){
    this.depth = depth;
    this.v = v;

    this.left = Tree.create(depth - 1);
    this.right = Tree.create(depth - 1);
  }

  static create(depth){
    if(depth === 0) return null;
    return new Tree(depth);
  }

  get(i){
    var m = 1 << this.depth - 1;
    i &= (m << 1) - 1;

    if(i === 0) return this.v;
    if((i & m) === 0) return this.left.get(i - 1);
    return this.right.get(i);
  }

  set(i, v){
    var m = 1 << this.depth - 1;
    i &= (m << 1) - 1;

    if(i === 0) return this.v = v;
    if((i & m) === 0) return this.left.set(i - 1, v);
    return this.right.set(i, v);
  }

  preorder(func){
    func(this.v);

    if(this.left !== null) this.left.preorder(func);
    if(this.right !== null) this.right.preorder(func);
  }
};