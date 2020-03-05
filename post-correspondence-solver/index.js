'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const debug = require('../debug');

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
    return dominosObj[name].map(a => [...a]);
  });

  const queue = [[null, null, 0, []]];

  let solution = null;

  mainLoop: while(queue.length !== 0 && solution === null){
    const elem = queue.shift();
    const type1 = elem[2];
    const type2 = type1 ? 0 : 1;
    const arr = elem[3];
    const len = arr.length;

    dominoLoop: for(let index = 0; index !== dominosNum; index++){
      const domino = dominos[index];
      const tokens1 = domino[type1];
      const tokens2 = domino[type2];
      const len1 = tokens1.length;
      const len2 = tokens2.length;
      const lenm = min(len, len2);

      if(len2 === 0) continue dominoLoop;

      for(let i = 0; i !== lenm; i++)
        if(tokens2[i] !== arr[i])
          continue dominoLoop;

      if(len2 < len){
        const arrNew = arr.slice(len2).concat(tokens1);
        queue.push([elem, index, type1, arrNew]);
        continue dominoLoop;
      }

      const lent1 = len1;
      const lent2 = len2 - len;
      const lentm = min(lent1, lent2);

      for(let i = 0; i !== lentm; i++)
        if(tokens1[i] !== tokens2[len + i])
          continue dominoLoop;

      if(lent1 === lent2){
        solution = [elem, index, null, []];
        break mainLoop;
      }

      if(lent1 < lent2)
        queue.push([elem, index, type2, tokens2.slice(len + lent1)]);
      else
        queue.push([elem, index, type1, tokens1.slice(len2 - len)]);
    }
  }

  if(solution === null)
    return null;

  const order = [];
  const arr = [];

  while(solution[0] !== null){
    const [prev, index] = solution;
    const tokens = dominos[index][0];

    order.push(names[index]);

    for(let i = tokens.length - 1; i !== -1; i--)
      arr.push(tokens[i]);

    solution = prev;
  }

  order.reverse();
  arr.reverse();

  return {order, arr};
};

module.exports = {
  solve,
};