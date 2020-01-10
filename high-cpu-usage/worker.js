'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const main = () => {
  O.enhanceRNG();

  while(1){
    const a = O.ca(1e3, () => O.rand(256));
    while(a.length !== 0) a.pop();
  }
};

main();