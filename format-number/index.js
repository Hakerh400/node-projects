'use strict';

module.exports = formatNumber;

function formatNumber(num){
  num = reverseStr(`${num}`);
  num = num.replace(/.{3}/g, digits => `${digits} `);
  num = reverseStr(num).trim();
  num = num.replace(/ /g, ',');

  return num;
}

function reverseStr(str){
  return [...str].reverse().join('');
}