'use strict';

module.exports = formatNumber;

function formatNumber(num){
  var sign = Math.sign(num);
  num = Math.abs(num);

  num = reverseStr(`${num}`);
  num = num.replace(/.{3}/g, digits => `${digits} `);
  num = reverseStr(num).trim();
  num = num.replace(/ /g, ',');

  if(sign === -1)
    num = `-${num}`;

  return num;
}

function reverseStr(str){
  return str.split('').reverse().join('');
}