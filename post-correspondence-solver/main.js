'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const pcp = require('.');

const main = () => {
  const dominos = [
    ['1', '111'],
    ['10111', '10'],
    ['10', '0'],
  ];

  const sol = pcp.solve(dominos);

  if(sol === null){
    log('null');
    return;
  }

  log(`Order: ${O.sfa(sol.order)}`);
  log(`String: ${sol.arr.join('')}`);
};

main();