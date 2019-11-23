'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const find = (start, end) => {
  const nodes = new Set();
  const nexts = new Map();
  const queue = new Set([start]);

  for(const node of queue){
    if(nodes.has(node)) continue;

    nodes.add(node);
    nexts.set(node, new Next(null, null));

    for(const ptr of node.ptrs)
      queue.add(ptr.node);
  }

  if(!nodes.has(end)) return null;

  nodes.delete(end);
  nexts.get(end).cost = 0;

  while(1){
    let found = 0;

    for(const node of nodes){
      const next = nexts.get(node);

      for(const ptr of node.ptrs){
        const next1 = nexts.get(ptr.node);
        if(next1.cost === null) continue;

        const cost = ptr.cost + next1.cost;

        if(next.cost === null || cost < next.cost){
          next.cost = cost;
          next.node = ptr.node;
          found = 1;
        }
      }
    }

    if(!found) break;
  }

  const path = [];
  let node = start;

  while(node !== end){
    path.push(node);
    node = nexts.get(node).node;
  }

  path.push(end);

  return [path, nexts.get(start).cost];
};

class Next{
  constructor(cost, node){
    this.cost = cost;
    this.node = node;
  }
}

module.exports = {
  find,
};