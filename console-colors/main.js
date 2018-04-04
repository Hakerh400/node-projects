'use strict';

var O = require('../framework');
var colors = require('.');

setTimeout(main);

function main(){
  console.log(colors.bgCol);
  console.log(colors.textCol);

  colors.textCol = 'rgb(200, 200, 15)';
  console.log(colors.bgCol);
  console.log(colors.textCol);

  colors.bgCol = 'rgb(7, 80, 0)';
  console.log(colors.bgCol);
  console.log(colors.textCol);
}