'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsm = require('.');
const Node = require('./node');

const ops = O.enum([
  'ALT',
]);

module.exports = reg => {
  const parts = reg.toString().split('/');
  const str = parts.slice(1, parts.length - 1).join('/');

  const root = new Node();;

  let start = root;
  let end = new Node();
  start.epsilons.push(end);

  const stack = [];

  O.tokenize(str, [
    /[\^\$]/, O.nop,

    /\|/, (str, gs) => {
      stack.push([ops.ALT, start, end]);

      start = root;
      end = new Node();
      start.epsilons.push(end);
    },

    /[\S\s]/, (str, gs) => {
      const root = new Node();
      let node = root;

      for(const bit of O.str2bits(str))
        node = node[bit | 0] = new Node();

      end.epsilons.push(root);
      end = node;
    },

    O.nop,
  ]);

  while(stack.length !== 0){
    const [op, n1, n2] = stack.pop();

    switch(op){
      case ops.ALT:
        const endNew = new Node();
        start = new Node().epsilons.push(start, n1);
        end.epsilons.push(endNew);
        n2.epsilons.push(endNew);
        end = endNew
        break;
    }
  }

  end.final = 1;

  return fsm.norm(root);
};