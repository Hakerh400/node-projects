'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const List = require('./list');

const {ListNode} = List;

const main = () => {
  const list = new List();

  list.push(new ListNode(list, 5));
  list.push(new ListNode(list, 7));
  list.push(new ListNode(list, 1122));

  list.head.insertBefore(new ListNode(list, 10));
  list.tail.insertBefore(new ListNode(list, 20));

  log([...list].map(a => a.val));
};

main();