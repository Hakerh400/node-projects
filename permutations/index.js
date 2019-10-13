'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = array => {
  const elems = O.sortAsc(O.undupe(array));
  const nums = elems.map(a => array.filter(b => b === a).length);
  const arrLen = array.length;
  const elemsNum = elems.length;
  const perms = [];

  const rec = (arr, nums, index) => {
    if(index === arrLen){
      perms.push(arr);
      return;
    }

    for(let i = 0; i !== elemsNum; i++){
      if(nums[i] === 0) continue;

      const arrNew = arr.slice();
      const numsNew = nums.slice();

      arrNew[index] = elems[i];
      numsNew[i]--;

      rec(arrNew, numsNew, index + 1);
    }
  };

  rec([], nums.slice(), 0);

  return perms;
};