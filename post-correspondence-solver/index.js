'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const {min, max, abs} = Math;

const solve = dominosObj => {
  if(Array.isArray(dominosObj)){
    const obj = O.obj();

    dominosObj.forEach((domino, index) => {
      obj[index] = domino;
    });

    dominosObj = obj;
  }

  const names = O.keys(dominosObj);
  const dominosNum = names.length;

  const dominos = names.map(name => {
    return dominosObj[name];
  });

  for(let i = 0; i !== dominosNum; i++){
    const domino = dominos[i];
    const [str1, str2] = domino;

    if(str1.length === 0 && str2.length === 0)
      return {order: [i], str: ''};
  }

  const cache = [O.obj(), O.obj()];
  const queue = [[null, null, 0, '']];

  let solution = null;

  const push = (prev, index, type, str) => {
    const cacheObj = cache[type];
    if(str in cacheObj) return;

    cacheObj[str] = 1;
    queue.push([prev, index, type, str]);
  };

  mainLoop: while(queue.length !== 0 && solution === null){
    const elem = queue.shift();
    const type1 = elem[2];
    const type2 = type1 ? 0 : 1;
    const str = elem[3];
    const len = str.length;

    dominoLoop: for(let index = 0; index !== dominosNum; index++){
      const domino = dominos[index];
      const str1 = domino[type1];
      const str2 = domino[type2];
      const len1 = str1.length;
      const len2 = str2.length;
      const lenm = min(len, len2);

      if(len2 === 0) continue dominoLoop;

      for(let i = 0; i !== lenm; i++)
        if(str2[i] !== str[i])
          continue dominoLoop;

      if(len2 < len){
        const strNew = str.slice(len2) + str1;
        push(elem, index, type1, strNew);
        continue dominoLoop;
      }

      const lent1 = len1;
      const lent2 = len2 - len;
      const lentm = min(lent1, lent2);

      for(let i = 0; i !== lentm; i++)
        if(str1[i] !== str2[len + i])
          continue dominoLoop;

      if(lent1 === lent2){
        solution = [elem, index, null, []];
        break mainLoop;
      }

      if(lent1 < lent2)
        push(elem, index, type2, str2.slice(len + lent1));
      else
        push(elem, index, type1, str1.slice(len2 - len));
    }
  }

  if(solution === null)
    return null;

  const order = [];
  let str = '';

  while(solution[0] !== null){
    const [prev, index] = solution;
    const s = dominos[index][0];

    order.push(names[index]);
    str = s + str;
    solution = prev;
  }

  order.reverse();

  return {order, str};
};

module.exports = {
  solve,
};