'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const debug = require('../../../debug');

const r = O.rand;

const codeGen = () => {
  const lhsArr = [''];
  const rhsArr = [];
  const ends = O.obj();

  const add = lhs => {
    if(lhsArr.some(a => a.startsWith(lhs)))
      return;

    const index = lhsArr.findIndex(a => lhs.startsWith(a));

    if(index !== -1){
      lhsArr[index] = lhs;
      return;
    }

    lhsArr.push(lhs);
  };

  const addAll = lhs => {
    for(let i = 0; i !== 2; i++)
      add(lhs + i);

    ends[lhs + '#'] = 1;
  };

  const addRec = (lhs, includeLast=1) => {
    const end = lhs.length + includeLast;

    for(let i = 0; i !== end; i++)
      addAll(lhs.slice(0, i));
  };

  const genRhs = () => {
    let rhs = '';
    let parens = 0;
    let hasArg = 0;
    let hasParens = 0;

    while(1){
      if(hasParens && hasArg && r()){
        if(parens === 0) break;

        rhs += ')';
        parens--;

        continue;
      }

      if(r()){
        if(r()){
          rhs += '(';
          parens++;
          hasArg = 0;
          hasParens = 1;
        }else{
          rhs += '.';
          hasArg = 1;
        }
      }else{
        rhs += r();
      }
    }

    if(rhs === '')
      rhs = '/';

    return rhs;
  };

  while(rhsArr.length !== lhsArr.length){
    const index = rhsArr.length;

    const lhs = lhsArr[index];
    const lhsLen = lhs.length;
    let lhsLenNew = 0;

    while(r())
      lhsLenNew++;

    const lhsLenDif = Math.max(lhsLenNew - lhsLen, 0);
    let lhsNew = lhs;

    for(let i = 0; i !== lhsLenDif; i++)
      lhsNew += r();

    addRec(lhsNew, 0);

    const rhs = genRhs();
    rhsArr.push(rhs);

    for(const match of O.exec(rhs, /\((\d*)/g))
      addRec(match[1]);
  }

  O.shuffle(rhsArr);

  return lhsArr.map((lhs, index) => {
    return [lhs, rhsArr[index]];
  }).concat(O.keys(ends).map(lhs => {
    let rhs = '';
    while(r()) rhs += r();
    return [lhs, rhs];
  })).sort(([lhs1], [lhs2]) => {
    lhs1 += '.';
    lhs2 += '.';

    for(let i = 0;; i++){
      const c1 = lhs1[i];
      const c2 = lhs2[i];
      assert(c1 !== '.');
      assert(c2 !== '.');
      if(c1 === c2) continue;

      const n1 = '01#'.indexOf(c1);
      const n2 = '01#'.indexOf(c2);

      return n1 - n2;
    }
  }).map(([lhs, rhs]) => {
    if(lhs === '') lhs = '/';
    if(rhs === '') rhs = '/';
    return `${lhs} - ${rhs}`;
  }).join('\n');
};

module.exports = codeGen;