'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = fNum;

function fNum(num, forceSign=0){
  var sign = Math.sign(num);
  num = Math.abs(num);

  num = reverseStr(`${num}`);
  num = num.replace(/.{3}/g, digits => `${digits} `);
  num = reverseStr(num).trim();
  num = num.replace(/ /g, ',');

  if(sign === -1) num = `-${num}`;
  else if(forceSign) num = `+${num}`;

  return num;
}

function reverseStr(str){
  return str.split('').reverse().join('');
}