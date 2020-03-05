'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const pcp = require('.');

const main = () => {
  const dominos = [
    /* 1 */ ['ab', 'aba'],
    /* 2 */ ['aab', 'aa'],
    /* 3 */ ['abb', 'ba'],
    /* 4 */ ['bbb', 'ba'],
    /* 5 */ ['aa', 'baba'],
    /* 6 */ ['babab', 'ba'],
    /* 7 */ ['b', 'ab'],
  ];

  const sol = pcp.solve(dominos);

  if(sol === null){
    log('No solution.');
    return;
  }

  log(`Order:  ${O.sfa(sol.order.map(a => +a + 1))}`);
  log(`String: ${sol.str}`);
};

main();