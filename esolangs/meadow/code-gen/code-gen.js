'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const cs = require('./ctors');
const opts = require('./opts');

const ps = opts.probabilities;

const codeGen = () => {
  const prog = new cs.Program();
  const base = new cs.Type(null, 'Base');

  prog.base = base;

  const typesArr = [base];
  const typesObj = O.nproto({[base.name]: base});

  const addType = (parent, name) => {
    const ptype = typesObj[parent];
    const type = new cs.Type(ptype, name);

    typesArr.push(type);
    typesObj[name] = type;
    ptype.exts.push(type);
  };

  const typeName = i => `A${i + 1}`;
  const funcName = i => `f${i + 1}`;

  [
    'Base', 'Bit',
    'Bit', '0',
    'Bit', '1',
    'Base', 'String',
    'String', 'EmptyString',
    'String', 'NonEmptyString',
  ].forEach((name, index, arr) => {
    if(index & 1) return;
    addType(name, arr[index + 1]);
  });

  typesObj.NonEmptyString.attrs.push(
    typesObj.Bit,
    typesObj.String,
  );

  const userTypesNum = ri(ps.userTypes);
  const userFuncsNum = ri(ps.userFuncs);

  for(let i = 0; i !== userTypesNum; i++){
    const parent = i !== 0 ? typeName(O.rand(i)) : 'Base';
    addType(parent, typeName(i));
  }

  const randType = () => {
    return typesArr[typesArr.length - O.rand(userTypesNum) - 1];
  };

  for(let i = 0; i !== userTypesNum; i++){
    const type = randType();

    O.repeat(ri(ps.attrs), () => {
      type.attrs.push(randType());
    });
  }

  for(let i = 0; i !== userFuncsNum; i++){
    const argsNum = ri(ps.args);
    const args = O.ca(argsNum, () => O.randElem(typesArr));
    const ret = O.randElem(typesArr);

    const func = new cs.Function(funcName(i), args, ret);
    prog.funcs.push(func);
  }

  return prog.toString();
};

const r = prob => {
  if(typeof prob !== 'number')
    throw new TypeError('Probability must be a number');

  return O.randf() < prob;
};

const ri = probs => {
  if(!Array.isArray(probs))
    throw new TypeError('Probabilities object must be an array of two numbers');

  return O.randInt(probs[0], probs[1]);
};

module.exports = codeGen;