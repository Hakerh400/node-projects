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

  // // Solution:
  // //   Path: (4,6,9,10,11,13,15,18,20,19,17,16,14,8,7,5,1,2,3,12)
  // //   Cost: 205.126333

  // const cs = [
  //   [62.0, 58.4], // 1
  //   [57.5, 56.0], // 2
  //   [51.7, 56.0], // 3
  //   [67.9, 19.6], // 4
  //   [57.7, 42.1], // 5
  //   [54.2, 29.1], // 6
  //   [46.0, 45.1], // 7
  //   [34.7, 45.1], // 8
  //   [45.7, 25.1], // 9
  //   [34.7, 26.4], // 10
  //   [28.4, 31.7], // 11
  //   [33.4, 60.5], // 12
  //   [22.9, 32.7], // 13
  //   [21.5, 45.8], // 14
  //   [15.3, 37.8], // 15
  //   [15.1, 49.6], // 16
  //   [ 9.1, 52.8], // 17
  //   [ 9.1, 40.3], // 18
  //   [ 2.7, 56.8], // 19
  //   [ 2.7, 33.1], // 20
  // ];

  // const num = cs.length;
  // const ns = O.ca(num, i => new Node(i + 1));

  // for(let i = 0; i !== num; i++){
  //   const node = ns[i];

  //   for(let j = 0; j !== num; j++){
  //     const node1 = ns[j];
  //     if(node1 === node) continue;

  //     node.addPtr(node1, O.dist(...[i, j].reduce((a, b) => {
  //       a.push(...cs[b]);
  //       return a;
  //     }, [])));
  //   }
  // }

  // const [path, cost] = shortestPath.find(ns[0], ns[1]);

  // log(`Path: (${path.map(a => a.name).join(',')})`);
  // log(`Cost: ${cost}`);
};

main();