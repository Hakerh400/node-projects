'use strict';

var O = require('../framework');
var colors = require('.');

setTimeout(main);

function main(){
  log(colors.bgCol);
  log(colors.textCol);

  colors.textCol = 'rgb(200, 200, 15)';
  log(colors.bgCol);
  log(colors.textCol);

  colors.bgCol = 'rgb(7, 80, 0)';
  log(colors.bgCol);
  log(colors.textCol);
}