'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Rational = require('.');

const main = () => {
  const a = .1;
  const b = .2;
  const c = a + b;
  log(c);

  const ar = new Rational(1n, 10n);
  const br = new Rational(2n, 10n);
  const cr = ar.add(br);
  log(cr.toFloat());
};

main();