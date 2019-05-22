'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Element = require('./element');
const Identifier = require('./identifier');
const Definition = require('./definition');
const Invocation = require('./invocation');

module.exports = {
  gen,
};

function gen(nest=0){
  const type = nest === 0 ?
    O.rand(2) + 1 :
    nest === 26 ?
      O.rand(2) << 1 :
      O.rand(3);

  switch(type){
    case 0:
      return new Identifier(O.rand(nest));
      break;

    case 1:
      return new Definition(gen(nest + 1));
      break;

    case 2:
      return new Invocation(gen(nest), gen(nest));
      break;
  }
}