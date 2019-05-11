'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../omikron');
const SG = require('../../serializable-graph');

const cwd = __dirname;

const nodes = [
  'undefined',
  'string',
  'array',
  'set',
  'map',
];

const ctorsArr = [];
const ctorsObj = {ctorsArr};

module.exports = ctorsObj;

for(let i = 0; i !== nodes.length; i++){
  const ctor = require(path.join(cwd, nodes[i]));
  ctorsArr.push(ctor);
  ctorsObj[ctor.name] = ctor;
}