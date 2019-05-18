'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const lambda = require('.');

setTimeout(main);

function main(){
  const G = (...a) => (a.a = 0, a);
  const F = (...a) => (a.a = 1, a);

  const B0 = F(F(0));
  const B1 = F(F(1));
  const P = F(F(F(0, 1, 2)));
  const E = G(F(0, 0), F(P, B0, G(0, 0)));

  const expr = G(P, E, E, B0, B0);

  lambda.reduce(expr);
}