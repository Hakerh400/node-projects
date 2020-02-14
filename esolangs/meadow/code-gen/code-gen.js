'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const cs = require('./ctors');
const opts = require('./opts');

const ps = opts.probabilities;

const codeGen = () => {
  const base = new cs.Type(null, 'Base');

  const typesArr = [base];
  const typesObj = O.nproto({[base.name]: base});
  const userTypes = [];

  const addType = (parent, name, isNative=0) => {
    const ptype = typesObj[parent];
    const type = new cs.Type(ptype, name);

    typesArr.push(type);
    typesObj[name] = type;
    ptype.exts.push(type);

    if(!isNative)
      userTypes.push(type);
  };

  [
    'Base', 'Bit',
    'Bit', '0',
    'Bit', '1',
    'Base', 'String',
    'String', 'EmptyString',
    'String', 'NonEmptyString',
  ].forEach((name, index, arr) => {
    if(index & 1) return;
    addType(name, arr[index + 1], 1);
  });

  typesObj.NonEmptyString.attrs.push(
    typesObj.Bit,
    typesObj.String,
  );

  return base.toString();
};

const r = prob => {
  if(typeof prob !== 'number')
    throw new TypeError('Probability must be a number');

  return O.randf() < prob;
};

module.exports = codeGen;