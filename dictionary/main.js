'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const dict = require('.');

const main = () => {
  log(dict.prod(`
    p P
    x A
    q Q
    y B
    r R
    q y r x p

    x y
    y x
    A B
    B C
    x y A B
  `));
};

main();