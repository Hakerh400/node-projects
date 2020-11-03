'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');
const debug = require('../debug');

const {min, max} = Math;

const MAX_LENGTH = 10;

const fin = format.path('-dw/in.txt');
const fout = format.path('-dw/out.txt');

const r = O.rand;
const rf = O.randf;

const main = () => {
  let inp = O.rfs(fin, 1).replace(/\s+/g, ' ');

  const data = getData(inp);
  const sample = genSample(data, 1e3);

  O.wfs(fout, sample);
};

const getData = inp => {
  const len = inp.length;
  const kLength = Symbol('length');
  const data = O.ca(MAX_LENGTH + 1, () => O.obj());

  let str = inp.slice(0, MAX_LENGTH);

  for(let i = MAX_LENGTH; i !== len; i++){
    const char = inp[i];

    for(let j = 0; j <= MAX_LENGTH; j++){
      const s = str.slice(MAX_LENGTH - j);
      const obj = data[j];

      if(!(s in obj)){
        const a = O.obj();
        a[kLength] = 0;
        obj[s] = a;
      }

      const a = obj[s];
      a[kLength]++;

      if(char in a) a[char]++;
      else a[char] = 1;
    }

    if(char === null) break;
    str = str.slice(1) + char;
  }

  for(const obj of data){
    for(const str in obj){
      const a = obj[str];
      const len = a[kLength];

      delete a[kLength];

      const b = O.keys(a).map(key => {
        const k = a[key] / len;
        return [key, k];
      }).sort((a, b) => {
        return a[1] - b[1];
      });

      let n = 0;

      for(const a of b){
        const c = a[1];
        a[1] += n;
        n += c;
      }

      obj[str] = b;
    }
  }

  return data;
};

const genSample = (data, len, str='') => {
  let lenTarget = MAX_LENGTH;

  for(let i = 0; i !== len; i++){
    let len = MAX_LENGTH;
    while(len !== 0 && rf() < .2) len--;
    len = min(lenTarget, len, MAX_LENGTH, str.length);

    const obj = data[len];
    const s = str.slice(str.length - len);

    if(!(s in obj)){
      lenTarget--;
      continue;
    }

    lenTarget = MAX_LENGTH;

    const a = obj[s];
    const n = a.length;
    const k = rf();

    let i = 0;
    let j = n - 1;

    while(i !== j){
      const m = i + j >> 1;
      if(a[m][1] > k) j = m;
      else i = m + 1;
    }

    const char = a[i][0];
    if(char === null) break;

    str += char;
  }

  return str;
};

main();