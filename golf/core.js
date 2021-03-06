'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const SINGLE_CHAR_COMBINATORS = 1;

const coreFuncNames = [
  'IOTA',
  'K',
  'S',
  'IO',
  'READ',
  'WRITE',
  'WRITE0',
  'WRITE1',
  'BIT0',
  'BIT1',
];

const core = O.obj();

for(let i = 0; i !== coreFuncNames.length; i++){
  const name = coreFuncNames[i];
  const sym = Symbol(name);

  core[name] = sym;
  core[sym] = name;
}

const getInfo = val => {
  if(typeof val !== 'symbol')
    return String(val);

  assert(typeof val === 'symbol');

  const name = val.description;

  if(SINGLE_CHAR_COMBINATORS){
    const str = 'iKSFABCD01';
    const index = coreFuncNames.indexOf(name);

    assert(index !== -1);
    assert(index < str.length);

    return str[index];
  }

  return `{${core[val]}}`;
};

module.exports = Object.assign(core, {
  SINGLE_CHAR_COMBINATORS,

  getInfo,
});