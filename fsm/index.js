'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const Node = require('./node');

const chars = O.chars('A', 26);

const fsm = {
  nodes(root){
    const visited = new Set();
    const indices = new Map();
    const stack = [root];
    const ns = [];

    while(stack.length !== 0){
      const node = stack.pop();
      if(visited.has(node)) continue;

      ns.push(node);
      visited.add(node);
      indices.set(node, ns.length - 1);
      
      stack.push(node[1], node[0]);
    }

    return [ns, indices];
  },

  rename(root){
    const [ns, indices] = fsm.nodes(root);
    const nsNew = ns.map((n, i) => new Node(O.sfcc(O.cc('A') + i)));

    ns.forEach((node, i) => {
      const nodeNew = nsNew[i];
      nodeNew.set(nsNew[indices.get(node[0])], nsNew[indices.get(node[1])]);
      if(node.final) nodeNew.final = 1;
    });

    return nsNew[0];
  },

  reduce(root){
    const [ns, indices] = fsm.nodes(root);
    const sets = [new Set(), new Set()];
    const setMap = new Map();

    for(const node of ns){
      const set = sets[node.final ? 1 : 0]
      set.add(node);
      setMap.set(node, set);
    }

    if(sets[0].size === 0) sets.shift();
    else if(sets[1].size === 0) sets.pop();

    mainLoop: while(1){
      for(let i = 0; i !== sets.length; i++){
        const set = sets[i];
        const setsNew = [];
        const map = new Map();
        const mapNew = new Map();

        for(const node of set){
          const s0 = setMap.get(node[0]);
          const s1 = setMap.get(node[1]);

          if(!map.has(s0)) map.set(s0, new Map());
          const map1 = map.get(s0);

          if(!map1.has(s1)){
            const set = new Set();
            map1.set(s1, set);
            setsNew.push(set);
          }

          const set1 = map1.get(s1);
          set1.add(node);
          mapNew.set(node, set1);
        }

        if(setsNew.length === 1) continue;

        sets[i] = setsNew[0];
        for(let i = 1; i !== setsNew.length; i++)
          sets.push(setsNew[i]);

        for(const node of set)
          setMap.set(node, mapNew.get(node));

        continue mainLoop;
      }

      break;
    }

    const setIndices = new Map();
    sets.forEach((set, i) => setIndices.set(set, i));

    const nsNew = sets.map(set => {
      const node = new Node();
      if(O.first(set).final) node.final = 1;
      return node;
    });

    nsNew.forEach((node, i) => {
      const set = sets[i];
      const first = O.first(set);
      const ptr0 = nsNew[setIndices.get(setMap.get(first[0]))];
      const ptr1 = nsNew[setIndices.get(setMap.get(first[1]))];
      node.set(ptr0, ptr1);
    });

    const rootNew = nsNew[setIndices.get(setMap.get(root))];

    return fsm.rename(rootNew);
  },
};

module.exports = fsm;