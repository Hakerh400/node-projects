'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const opts = require('./opts');

const ps = opts.probabilities;

const codeGen = () => {
  let str = '';

  const add = (...args) => {
    str += args.jon('');
  }

  const genLhs = base => {
    const lhs = base;
    let more = 1;

    for(let i = 0; i !== lhs.length; i++){
      if(!r(ps.lhsMore)){
        more = 0;
        break;
      }
    }

    while(more){
      lhs.push(0);
      more = r(ps.lhsMore);
    }

    return lhs.join('');
  };

  const genRhs = isEnd => {
    let str = '';

    if(isEnd && !opts.rhsGroupsAllowedOnEnd){
      while(r(ps.rhsMoreBitsOnEnd))
        str += r(ps.bit1) ? 1 : 0;

      if(str === '') str = '/';
      return str;
    }

    const stack = [0];
    let hasRest = 0;

    while(1){
      if(!r(ps.rhsMore)){
        if(stack.length === 1) break;
        stack.pop();
        str += ')';
        continue;
      }

      let startGroup = 1;

      for(let i = stack.length + O.last(stack); i !== -1; i--){
        if(!r(ps.rhsStartGroup)){
          startGroup = 0;
          break;
        }
      }

      if(startGroup){
        stack[stack.length - 1]++;
        stack.push(0);
        str += '(';
        continue;
      }

      if(!isEnd && r(ps.rest)){
        str += '.';
        hasRest = 1;
        continue;
      }

      str += r(ps.bit1) ? 1 : 0;
    }

    if(str === '') str = '/';
    return str;
  };

  const pat = [0];
  let first = 1;

  mainLoop: while(pat.length !== 0){
    if(first) first = 0;
    else str += '\n';

    str += `${genLhs(pat)} - ${genRhs(0)}`;

    while(O.last(pat) !== 0){
      if(pat.length !== 0) pat.pop();
      str += `\n${pat.join('')}# - ${genRhs(1)}`;
      if(pat.length === 0) break mainLoop;
    }

    pat[pat.length - 1] = 1;
  }

  // O.exit(str);

  return str;
};

const r = prob => {
  if(typeof prob !== 'number')
    throw new TypeError('Probability must be a number');

  return O.randf() < prob;
};

module.exports = codeGen;