'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class ListNode{
  constructor(list, val, prev=null, next=null){
    this.list = list;
    this.val = val;
    this.prev = prev;
    this.next = next;
  }

  slice(list){
    return new ListNode(list, this.val);
  }

  insertBefore(node){
    const {list} = this;

    if(this === list.head) return list.unshift(node);

    node.prev = this.prev;
    node.next = this;
    node.prev.next = node;
    this.prev = node;
  }

  insertAfter(node){
    const {list} = this;

    if(this === list.tail) return list.push(node);

    node.prev = this;
    node.next = this.next;
    this.next = node;
    node.next.prev = node;
  }

  remove(){
    const {list, prev, next} = this;

    if(this === list.head) return list.shift();
    if(this === list.tail) return list.pop();

    prev.next = next;
    next.prev = prev;
  }
}

module.exports = ListNode;