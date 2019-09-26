'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const types = O.enum([
  'UNIFORM',
  'INCREMENTAL',
  'PROBABILITY',
]);

const randData = O.nproto({
  classesNum:  [types.INCREMENTAL, 5, .9],
  genericsNum: [types.INCREMENTAL, 0, .25],
  argsNum:     [types.INCREMENTAL, 0, .67],
  pickGeneric: [types.PROBABILITY, .25],
});

const rand = O.obj();

for(const param of O.keys(randData)){
  const [type, ...data] = randData[param];

  Object.defineProperty(rand, param, {
    get(){
      switch(type){
        case types.UNIFORM: return O.rand(data[0], data[1]); break;
        case types.INCREMENTAL: return O.randInt(data[0], data[1]); break;
        case types.PROBABILITY: return O.randf() < data[0]; break;
      }
    },
  });
}

module.exports = rand;