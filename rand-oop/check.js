'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const assert = require('assert');

const ok = assert.ok;
const eq = assert.strictEqual;

const check = {
  elem(obj, type, allowNull=0){
    if(allowNull && obj === null) return obj;
    ok(obj instanceof type);
    return obj;
  },

  arr(arr, type){
    if(arr instanceof Collection) arr = arr.toArr();
    ok(Array.isArray(arr));
    for(const obj of arr) check.elem(obj, type);
    return arr;
  },

  str(val){
    ok(typeof val === 'string');
    return val;
  },

  func(val){
    ok(typeof val === 'function');
    return val;
  },
};

module.exports = check;

const Collection = require('./collection');