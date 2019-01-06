'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const arrOrder = require('.');

setTimeout(main);

function main(){
  const vals = [1, 2, 3, [], {}, NaN, 'abc'];

  for(let i = 0n; i !== 1000n; i++){
    let arr = arrOrder.arr(vals, i, 0);
    let id = arrOrder.id(vals, arr, 0);
    assert.strictEqual(id, i);

    arr = arrOrder.arr(vals, i, 1);
    id = arrOrder.id(vals, arr, 2);
    assert.strictEqual(id, i);
  }
}