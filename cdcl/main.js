'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const main = () => {
  const knf = new Set([
    O.nproto({x: 1, y: 0}),
    O.nproto({x: 0, y: 1}),
  ]);

  const sol = solve(knf);

  for(const ident of O.sortAsc(O.keys(sol)))
    log(`${`${ident}`.padEnd(5)}${sol[ident]}`);
};

const solve = knf => {
  const clauses = [];

  for(const obj of knf){
    const clause = [];

    for(const ident in obj)
      clause.push([ident, obj[ident], 1]);
  }

  const binds = [];
  const impls = [];

  while(1){
    const clauseIndex = clauses.find(clause => {
      
    });
  }
};

main();