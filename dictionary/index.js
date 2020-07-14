'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const prod = str => {
  const lines = O.sanl(str.trim()).map(a => a.trim());
  const boundary = lines.indexOf('');

  const parse = a => {
    a = a.map(a => a.split(/\s+/));

    const map = new Map();
    map.keys2 = a.pop();
    map.keys1 = a.map(a => a[0]);

    for(const [b, c] of a)
      map.set(b, c);

    return map;
  };

  const set = (X, key, val) => {
    assert(typeof key === 'string');
    assert(typeof val === 'string');

    if(!X.has(key)){
      X.set(key, val);
      X.keys1.push(key);
      X.keys2.push(key);
      return;
    }

    X.set(key, val);
    X.keys2.splice(X.keys2.indexOf(key), 1);
    X.keys2.push(key);
  };

  const A = parse(lines.slice(0, boundary));
  const B = parse(lines.slice(boundary + 1));

  for(const [key, val] of A){
    if(!B.has(key)) set(B, key, key);
    if(!B.has(val)) set(B, val, val);
  }

  const C = new Map();
  C.keys1 = [];
  C.keys2 = [];

  for(const keys of [A.keys1, A.keys2]){
    for(const K1 of keys){
      const K2 = B.get(K1);
      const S = new Set(B.keys1.filter(a => B.get(a) === K2));
      const K3 = A.keys2.reduce((a, b) => S.has(b) ? b : a);

      set(C, K2, B.get(A.get(K3)));
    }
  }

  return [C.keys1.map(a => [a, C.get(a)].join(' ')).join('\n'), C.keys2.join(' ')].join('\n');
};

module.exports = {
  prod,
};