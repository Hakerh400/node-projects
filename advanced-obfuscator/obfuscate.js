'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = obfuscate;

function obfuscate(str, evalScript){
  str = encode(`return a=f=t="",l=u=>(f+=+!!u,++t-8||(a+=String.fromCharCode(+("0b"+f)),t=0,f=""),l),l[""]=f=>Function(a)(),l`) +
    str.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, 0).split('').map(bit => {
        return +bit ? '([])' : '()';
      }).join('');
    }).join('') + '[[]]()';

  // if(evalScript) new Function(str)();
  return str;
}

function encode(str){
  return O.rfs('C:/users/Thomas/Downloads/1.js', 1);
}