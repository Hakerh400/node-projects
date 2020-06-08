'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Repl = require('.');

const main = () => {
  const repl = new Repl();

  repl.eval('var a = 5');
  repl.eval('var b = a + 2');

  log(repl.eval('a + b'));
};

main();