'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const Node = require('./node');

const chars = O.chars('A', 26);

const fsm = {
  closure(root){
    const stack = [root];
    const closure = new Set(stack);

    while(stack.length !== 0){
      const node = stack.pop();

      for(const ptr of node.epsilons){
        if(closure.has(ptr)) continue;
        closure.add(ptr);
        stack.push(ptr);
      }
    }

    return closure;
  },

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
      const set = sets[node.final ? 1 : 0];
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

  det(root){
    const [ns, indices] = fsm.nodes(fsm.rename(root));

    const errNode = new Node();
    errNode.set(errNode, errNode);
    ns.push(errNode);
    indices.set(errNode, ns.length - 1);

    for(const node of ns){
      if(node[0] === null) node[0] = errNode;
      if(node[1] === null) node[1] = errNode;
    }

    const closure = fsm.closure(root);
    const stack = [closure];
    const sets = [closure];
    const setNodes = new Map([[closure, new Node()]]);

    while(stack.length !== 0){
      const set = stack.pop();
      const setNode = setNodes.get(set);

      for(const node of set){
        if(node.final){
          setNode.final = 1;
          break;
        }
      }

      for(let ptri = 0; ptri !== 2; ptri++){
        const ptrSet = new Set();

        for(const node of set)
          for(const node1 of fsm.closure(node[ptri]))
            ptrSet.add(node1);

        const index = sets.findIndex(set => {
          if(set.size !== ptrSet.size) return 0;

          for(const node of set)
            if(!ptrSet.has(node))
              return 0;

          return 1;
        });

        if(index === -1){
          const ptr = new Node();

          stack.push(ptrSet);
          sets.push(ptrSet);
          setNodes.set(ptrSet, ptr);
          setNode[ptri] = ptr;
        }else{
          setNode[ptri] = setNodes.get(sets[index]);
        }
      }
    }

    const rootNew = setNodes.get(closure);

    return fsm.reduce(rootNew);
  },

  norm(root){
    return fsm.det(root);
  },

  genStr(root){
    const [ns, indices] = fsm.nodes(fsm.norm(root));

    const errIndex = ns.findIndex(n => !n.final && n[0] === n && n[1] === n);
    const errNode = errIndex !== -1 ? ns[errIndex] : null;
    if(root === errNode) return null;

    let str = '';
    let node = ns[0];

    while(!(node.final && O.rand(2))){
      const a0 = node[0] !== errNode;
      const a1 = node[1] !== errNode;
      if(!(a0 || a1)) break;

      const ptri = !a0 ? 1 : !a1 ? 0 : O.rand(2);
      str += ptri;
      node = node[ptri];
    }

    return str;
  },
};

module.exports = fsm;