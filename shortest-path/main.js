'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const shortestPath = require('.');
const Node = require('./node');
const Pointer = require('./pointer');

const main = () => {
  const ns = O.ca(9, i => new Node(i));

  ns[0].addPtrs([ns[1], 4, ns[7], 8]);
  ns[1].addPtrs([ns[0], 4, ns[2], 8, ns[7], 11]);
  ns[2].addPtrs([ns[1], 8, ns[3], 7, ns[5], 4, ns[8], 2]);
  ns[3].addPtrs([ns[2], 7, ns[4], 9, ns[5], 14]);
  ns[4].addPtrs([ns[3], 9, ns[5], 10]);
  ns[5].addPtrs([ns[2], 4, ns[3], 14, ns[4], 10, ns[6], 2]);
  ns[6].addPtrs([ns[5], 2, ns[7], 1, ns[8], 6]);
  ns[7].addPtrs([ns[0], 8, ns[1], 11, ns[6], 1, ns[7], 7]);
  ns[8].addPtrs([ns[2], 2, ns[6], 6, ns[7], 7]);

  const [path, cost] = shortestPath.find(ns[0], ns[4]);

  log(`Path: (${path.map(a => a.name).join(',')})`);
  log(`Cost: ${cost}`);
};

main();