'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const ListNode = require('./list-node');

class List{
  head = null;
  tail = null;

  get isEmpty(){ return this.head === null; }

  slice(){
    const list = new List();

    for(const node of this)
      list.push(node.slice());

    return list;
  }

  unshift(node){
    if(this.isEmpty){
      node.prev = node.next = null;
      this.head = this.tail = node;
      return;
    }

    node.prev = null;
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }

  push(node){
    if(this.isEmpty){
      node.prev = node.next = null;
      this.head = this.tail = node;
      return;
    }

    node.prev = this.tail;
    node.next = null;
    this.tail.next = node;
    this.tail = node;
  }

  shift(){
    if(this.isEmpty)
      throw new TypeError('Cannot shift from an empty list');

    const node = this.head;
    this.head = node.next;

    if(this.head !== null) this.head.prev = null;
    else this.tail = null;

    return node;
  }

  pop(){
    if(this.isEmpty)
      throw new TypeError('Cannot pop from an empty list');

    const node = this.tail;
    this.tail = node.prev;

    if(this.tail !== null) this.tail.next = null;
    else this.head = null;

    return node;
  }

  *[Symbol.iterator](){
    let node = this.head;

    while(node !== null){
      yield node;
      node = node.next;
    }
  }
}

module.exports = Object.assign(List, {
  ListNode,
});