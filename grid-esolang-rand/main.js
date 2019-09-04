'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const rand = a => O.rand(a) + 1;
const pick = a => O.randElem(a);

main();

function main(){
  let str = '';
  let stack = [];

  while(1){
    if(O.last(stack, 0) === 0 && rand(20) <= stack.length + 1){
      if(stack.length === 0) break;

      str += ')';
      stack.pop();

      if(--stack[stack.length - 1] !== 0){
        str += '(';
        stack.push(0);
      }

      continue;
    }

    switch(rand(6)){
      case 1: {
        str += pick('^>v<');
        break;
      }

      case 2: {
        str += `${pick('URDLBWXI')}${pick(['+', '-', ''])}`;
        break;
      }

      case 3: {
        const type = pick('?*:');
        str += `${pick('URDLBWXI')}${type}(`;
        stack[stack.length - 1] = type === '?' ? 2 : 1;
        stack.push(0);
        break;
      }

      case 4: {
        const type = pick('?*:');
        str += `.${type}(`;
        stack[stack.length - 1] = type === '?' ? 2 : 1;
        stack.push(0);
        break;
      }

      case 5: {
        str += `.${O.ca(O.randInt(1, .5), () => O.rand(2)).join('')}`;
        break;
      }

      case 6: {
        str += 'A';
        break;
      }
    }
  }

  log(str);
}