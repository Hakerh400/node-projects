'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');

const n = 1e7;
const a = (a => a('[') + a(']'))(a => a.repeat(n));

const parse = str => {
  const parse = function*(str){
    if(str === '[]') return [];

    assert(str[0] === '[');
    assert(O.last(str) === ']');
    return [yield [parse, str.slice(1, str.length - 1)]];
  };

  return O.rec(parse, str);
};

const depth = arr => {
  const depth = function*(arr){
    if(arr.length === 0) return 1;

    assert(arr.length === 1);
    return (yield [depth, arr[0]]) + 1;
  };

  return O.rec(depth, arr);
};

const b = parse(a);
const c = depth(b);
assert(c === n);

log(format.num(c));