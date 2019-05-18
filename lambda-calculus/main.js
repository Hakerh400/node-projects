'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const L = require('.');

const {G, F} = L;

const B0 = F(F(0));
const B1 = F(F(1));
const P = F(F(F(0, 1, 2)));
const E = G(F(0, 0), F(P, B0, G(0, 0)));

setTimeout(main);

function main(){
  {
    const e1 = F(F(0), F(0, 0), F(0), F(0, 0));
    const e2 = F(F(0), F(0), F(0, 0));

    log(L.cmp(e1, e2, 1) ? 'Equal' : 'Different');
  }
  return;

  const S = G(P, B1, G(P, B1, G(P, B1, G(P, B1, G(P, B1, G(P, B0, G(P, B1, G(P, B1, E))))))));
  const C = getCode();
  const e = G(C, S);

  const bit = (e, n) => {
    const expr = G(e);

    while(n--) expr.push(B1);
    expr.push(B0);

    const isZero = L.cmp(expr, B0);
    const isOne = L.cmp(expr, B1);

    return isZero ? '0' : isOne ? '1' : '?';
  };

  const expected = '1110111100';

  const actual = O.ca(expected.length, i => {
    return bit(e, i);
  }).join('');

  log(expected);
  log(actual);
}

function getCode(){
  return G(
    F(F(1, 1, 0, E)), F(F(F(
      1, B0, G(
        2, 2,
        G(1, B1, B1),
        G(P, B1, G(P, G(1, B1, B0), 0))
      ), 0
    )))
  );
}