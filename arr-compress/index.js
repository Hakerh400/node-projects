'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const debug = require('../debug');
const NumberSet = require('./number-set');

const {min, max} = Math;

const compress = arr => {
  arr = [0, ...arr];

  const arrs = new O.MultidimensionalMap();

  while(1){
    if(arrs.has(arr)) return arr;
    arrs.set(arr, 1);

    const len = arr.length;
    const pats = new O.MultidimensionalMap();
    const best = [0, null];

    let numMax = 0;

    for(let i = 1; i !== len; i++){
      const num = arr[i];
      if(num > numMax) numMax = num;

      for(let j = 0; j !== i; j++){
        const slen = j + 2;
        const start = i - slen + 1;
        const pat = arr.slice(start, i + 1);

        if(!pats.has(pat)){
          pats.set(pat, new NumberSet([start]));
        }else{
          const indices = pats.get(pat);
          if(start - indices.last < slen) continue;
          
          indices.add(start);
        }

        const c = pats.get(pat).size;
        const dif = c * (slen - 1) - slen - 1;

        if(dif > best[0]){
          best[0] = dif;
          best[1] = pat;
        }
      }
    }

    {
      const pat = best[1];
      if(pat === null) return arr;

      const plen = pat.length;
      const indices = pats.get(pat);
      const arrNew = [plen - 1, ...pat];
      const numNew = max(numMax, plen - 1) + 1;

      for(let i = 0; i !== len;){
        assert(i < len);

        const num = arr[i];

        if(!indices.has(i)){
          arrNew.push(num);
          i++;
          continue;
        }

        arrNew.push(numNew);
        i += plen;
      }

      arr = arrNew;
    }
  }
};

const decompress = arr => {
  while(1){
    if(arr[0] === 0) return arr.slice(1);

    const len = arr.length;
    const numMax = arr.reduce((a, b) => max(a, b), 0);
    const plen = arr[0] + 1;
    const pat = arr.slice(1, plen + 1);
    const arrNew = [];

    for(let i = plen + 1; i !== len; i++){
      assert(i < len);

      const num = arr[i];

      if(num !== numMax){
        arrNew.push(num);
        continue;
      }

      for(const num of pat)
        arrNew.push(num);
    }

    arr = arrNew;
  }
};

module.exports = {
  compress,
  decompress,
};