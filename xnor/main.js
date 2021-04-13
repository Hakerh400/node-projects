'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const main = () => {
  const list = [
    0b0011,
    0b0101,
  ];

  const add = a => {
    assert(a >= 0 && a < 16);
    if(list.includes(a)) return;
    list.push(a);
  };

  const not = a => {
    return a ^ 15;
  };

  const xor = (a, b) => {
    return a ^ b;
  };

  for(let i = 0; i !== list.length; i++){
    const x = list[i];
    add(not(x));

    for(let j = 0; j <= i; j++){
      const y = list[j];
      add(xor(x, y));
    }
  }

  const all = O.ca(16, i => i);

  const [a, b] = [
    all.filter(a => list.includes(a)),
    all.filter(a => !list.includes(a)),
  ].map(a => a.map(a => a.toString(2).padStart(4, '0')).join('\n'));

  log(a);
  O.logb();
  log(b);
};

main();